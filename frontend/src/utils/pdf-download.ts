import { jsPDF } from "jspdf";
import { Order, OrderDisplay } from "@/types/order";
import { Tenant } from "@/types/users";

export interface InvoiceItem {
  id?: string;
  title: string;
  specs?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
}

export interface InvoiceData {
  storeName: string;
  storeLogoUrl?: string | null;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  tenantSlug: string;
  primaryColor?: string;

  orderNumber: string;
  orderReference?: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;

  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fulfillmentType?: string;
  deliveryDate?: string;
  deliveryAddress?: string;

  items: InvoiceItem[];

  subtotal: number;
  deliveryFee: number;
  taxAmount?: number;
  taxTitle?: string;
  totalAmount: number;
  currency: string;
}

function hexToRgb(hex?: string): [number, number, number] {
  if (!hex || !hex.startsWith("#")) return [15, 23, 42]; // Slate-900 default
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [15, 23, 42];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function formatAmount(amount: number, currency: string = "NGN"): string {
  const code = (currency || "NGN").toUpperCase();
  const formattedNumber = Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${code} ${formattedNumber}`;
}

/**
 * Strips verbose promotional prefixes like "OFFICIAL ONLINE STORE FOR "
 * and returns clean store name like "JAZZ CAKES LTD".
 */
export function sanitizeStoreName(rawName?: string, slug?: string): string {
  if (rawName && rawName.trim()) {
    const clean = rawName
      .trim()
      .replace(/^(official\s+online\s+store\s+(for\s+)?)/i, "")
      .replace(/^(online\s+store\s+(for\s+)?)/i, "")
      .replace(/^(official\s+store\s+(for\s+)?)/i, "")
      .trim();
    if (clean) return clean;
  }
  if (slug) {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "Store";
}

export interface LoadedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Asynchronously loads an image URL into a base64 data string and dimensions for jsPDF rendering.
 * If isRounded is true, clips to a square rounded-corner thumbnail.
 * If isRounded is false, preserves the exact natural dimensions and aspect ratio.
 */
async function loadBase64Image(
  url: string,
  isRounded: boolean = false,
  cornerRadius: number = 16,
): Promise<LoadedImageResult | null> {
  if (!url || typeof window === "undefined") return null;

  const processImageToDataUrl = (
    img: HTMLImageElement,
  ): LoadedImageResult | null => {
    try {
      const naturalW = img.naturalWidth || img.width || 120;
      const naturalH = img.naturalHeight || img.height || 120;
      const aspectRatio = naturalW / (naturalH || 1);

      const canvas = document.createElement("canvas");
      // For rounded product thumbnails, use a square canvas
      const w = isRounded ? 120 : naturalW;
      const h = isRounded ? 120 : naturalH;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      if (isRounded) {
        const r = Math.min(cornerRadius, w / 4, h / 4);
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(0, 0, w, h, r);
        } else {
          ctx.moveTo(r, 0);
          ctx.lineTo(w - r, 0);
          ctx.quadraticCurveTo(w, 0, w, r);
          ctx.lineTo(w, h - r);
          ctx.quadraticCurveTo(w, h, w - r, h);
          ctx.lineTo(r, h);
          ctx.quadraticCurveTo(0, h, 0, h - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.closePath();
        }
        ctx.clip();
      }

      ctx.drawImage(img, 0, 0, w, h);
      return {
        dataUrl: canvas.toDataURL("image/png"),
        width: naturalW,
        height: naturalH,
        aspectRatio,
      };
    } catch {
      return null;
    }
  };

  const loadImageElement = (src: string): Promise<LoadedImageResult | null> => {
    return new Promise<LoadedImageResult | null>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const dataUrl = processImageToDataUrl(img);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // 1. Data URLs
  if (url.startsWith("data:image/")) {
    return await loadImageElement(url);
  }

  // 2. Direct fetch with CORS
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const dataUrl = await loadImageElement(objectUrl);
      URL.revokeObjectURL(objectUrl);
      if (dataUrl) return dataUrl;
    }
  } catch {
    // Direct fetch failed, fallback to proxy
  }

  // 3. Backend proxy route to bypass Neon S3/external CORS restrictions
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const proxyUrl = `/api/uploads/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const dataUrl = await loadImageElement(objectUrl);
        URL.revokeObjectURL(objectUrl);
        if (dataUrl) return dataUrl;
      }
    } catch {
      // Proxy failed
    }
  }

  // 4. Fallback to image element
  return await loadImageElement(url);
}

let cachedFontsPromise: Promise<{
  dmSansReg: string | null;
  dmSansBold: string | null;
  bricoBold: string | null;
}> | null = null;

async function loadAppFonts(): Promise<{
  dmSansReg: string | null;
  dmSansBold: string | null;
  bricoBold: string | null;
}> {
  if (cachedFontsPromise) return cachedFontsPromise;

  cachedFontsPromise = (async () => {
    try {
      const dmRegUrl =
        "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf";
      const dmBoldUrl =
        "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf";
      const bricoBoldUrl =
        "https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvfzlyM0.ttf";

      const fetchFontBinary = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const buf = await res.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buf);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return binary;
        } catch {
          return null;
        }
      };

      const [dmSansReg, dmSansBold, bricoBold] = await Promise.all([
        fetchFontBinary(dmRegUrl),
        fetchFontBinary(dmBoldUrl),
        fetchFontBinary(bricoBoldUrl),
      ]);

      return { dmSansReg, dmSansBold, bricoBold };
    } catch {
      return { dmSansReg: null, dmSansBold: null, bricoBold: null };
    }
  })();

  return cachedFontsPromise;
}

/**
 * Generates and downloads a clean, professional PDF invoice directly to the user's device.
 */
export async function downloadInvoicePdf(invoice: InvoiceData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const [pr, pg, pb] = hexToRgb(invoice.primaryColor);

  // 1. Preload Fonts, Store Logo, and Product Images in parallel
  const [fonts, logoBase64, ...itemBase64s] = await Promise.all([
    loadAppFonts(),
    invoice.storeLogoUrl
      ? loadBase64Image(invoice.storeLogoUrl, false)
      : Promise.resolve(null),
    ...invoice.items.map((it) =>
      it.image ? loadBase64Image(it.image, true, 22) : Promise.resolve(null),
    ),
  ]);

  // Register App Fonts (DM Sans for body, Bricolage Grotesque for titles)
  let primaryFont = "helvetica";
  let headingFont = "helvetica";

  if (fonts.dmSansReg && fonts.dmSansBold) {
    try {
      doc.addFileToVFS("DMSans-Regular.ttf", fonts.dmSansReg);
      doc.addFont("DMSans-Regular.ttf", "DMSans", "normal");
      doc.addFileToVFS("DMSans-Bold.ttf", fonts.dmSansBold);
      doc.addFont("DMSans-Bold.ttf", "DMSans", "bold");
      primaryFont = "DMSans";
    } catch (e) {
      console.warn("Could not register DM Sans font in PDF:", e);
    }
  }

  if (fonts.bricoBold) {
    try {
      doc.addFileToVFS("Bricolage-Bold.ttf", fonts.bricoBold);
      doc.addFont("Bricolage-Bold.ttf", "Bricolage", "bold");
      headingFont = "Bricolage";
    } catch (e) {
      console.warn("Could not register Bricolage font in PDF:", e);
    }
  }

  // 2. Header (Plain White Background)
  let headerTextX = margin;
  if (logoBase64) {
    try {
      // Natural aspect ratio scaling to prevent vertical stretching
      const maxLogoW = 14; // mm
      const maxLogoH = 9.5; // mm
      const aspect = logoBase64.aspectRatio || 1;

      let logoW: number;
      let logoH: number;

      if (aspect >= maxLogoW / maxLogoH) {
        logoW = maxLogoW;
        logoH = maxLogoW / aspect;
      } else {
        logoH = maxLogoH;
        logoW = maxLogoH * aspect;
      }

      const textCenterY = 20.5;
      const logoY = textCenterY - logoH / 2;
      doc.addImage(logoBase64.dataUrl, "PNG", margin, logoY, logoW, logoH);
      headerTextX = margin + logoW + 3;
    } catch (e) {
      console.warn("Could not render logo in PDF:", e);
    }
  }

  // Store Brand Title (Clean Name with app's heading font)
  doc.setTextColor(15, 23, 42);
  doc.setFont(headingFont, "bold");
  doc.setFontSize(15);
  const cleanStoreTitle = sanitizeStoreName(
    invoice.storeName,
    invoice.tenantSlug,
  ).toUpperCase();
  doc.text(cleanStoreTitle, headerTextX, 19.5);

  // Subtitle (with app's primary body font)
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Official Store Receipt & Invoice", headerTextX, 24.5);

  // Right Side Header: INVOICE title with app's heading font
  doc.setFont(headingFont, "bold");
  doc.setFontSize(20);
  doc.setTextColor(pr, pg, pb);
  doc.text("INVOICE", pageWidth - margin, 21.5, { align: "right" });

  // Divider below top header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 35, pageWidth - margin, 35);

  let currentY = 43;

  // 3. Two-Column Metadata (40% Billed To, 60% Invoice Summary)
  // Usable width = 180mm. 40% = 72mm, 60% = 108mm.
  // Left Column: Customer & Coordinates (40% width = 72mm)
  const leftColX = margin;
  const leftColWidth = 66;

  doc.setFontSize(8);
  doc.setFont(primaryFont, "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("BILLED TO:", leftColX, currentY);

  doc.setFontSize(10);
  doc.setFont(headingFont, "bold");
  doc.setTextColor(15, 23, 42);
  const nameLines = doc.splitTextToSize(
    invoice.customerName || "Valued Customer",
    leftColWidth,
  );
  doc.text(nameLines, leftColX, currentY + 5.5);

  let leftY = currentY + 5.5 + nameLines.length * 4.5;

  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (invoice.customerEmail) {
    const emailLines = doc.splitTextToSize(invoice.customerEmail, leftColWidth);
    doc.text(emailLines, leftColX, leftY);
    leftY += emailLines.length * 4.2;
  }
  if (invoice.customerPhone) {
    doc.text(invoice.customerPhone, leftColX, leftY);
    leftY += 4.2;
  }
  if (invoice.fulfillmentType) {
    const fType =
      invoice.fulfillmentType.charAt(0).toUpperCase() +
      invoice.fulfillmentType.slice(1);
    doc.text(`Fulfillment: ${fType}`, leftColX, leftY);
    leftY += 4.2;
  }
  if (invoice.deliveryDate) {
    doc.text(`Schedule: ${invoice.deliveryDate}`, leftColX, leftY);
    leftY += 4.2;
  }
  if (invoice.deliveryAddress) {
    const addressLines = doc.splitTextToSize(
      `Delivery: ${invoice.deliveryAddress}`,
      leftColWidth,
    );
    doc.text(addressLines, leftColX, leftY);
    leftY += addressLines.length * 4.2;
  }

  // Right Column: Invoice Details (60% width = 108mm, starts at margin + 72 = 87mm)
  const rightColX = margin + 72;
  const rightColRightEdge = pageWidth - margin;

  doc.setFontSize(8);
  doc.setFont(primaryFont, "bold");
  doc.setTextColor(148, 163, 184);
  doc.text("INVOICE SUMMARY:", rightColX, currentY);

  let rightY = currentY + 5.5;

  // Invoice Number (Label and value on the EXACT SAME line)
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Invoice Number:", rightColX, rightY);

  doc.setFont(primaryFont, "bold");
  const displayInvoiceNum = `#${invoice.orderNumber || invoice.orderReference || "ORDER"}`;
  doc.setFontSize(displayInvoiceNum.length > 25 ? 7 : 8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(displayInvoiceNum, rightColRightEdge, rightY, {
    align: "right",
  });
  rightY += 5.5;

  // Order Date
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Order Date:", rightColX, rightY);
  doc.setFont(primaryFont, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(
    invoice.orderDate || new Date().toLocaleDateString(),
    rightColRightEdge,
    rightY,
    {
      align: "right",
    },
  );
  rightY += 5.5;

  // Payment Gateway
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Gateway:", rightColX, rightY);
  doc.setFont(primaryFont, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(
    invoice.paymentMethod || "Online Payment",
    rightColRightEdge,
    rightY,
    {
      align: "right",
    },
  );
  rightY += 6;

  // Payment Status: Styled Badge
  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Status:", rightColX, rightY);

  const statusText = (invoice.paymentStatus || "PAID").toUpperCase();
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(7.5);
  const statusTextWidth = doc.getTextWidth(statusText);
  const badgePadX = 3.5;
  const badgeWidth = statusTextWidth + badgePadX * 2;
  const badgeHeight = 5.2;
  const badgeX = rightColRightEdge - badgeWidth;
  const badgeY = rightY - 3.8;

  const isDeliveredOrPaid = [
    "PAID",
    "DELIVERED",
    "ACCEPTED",
    "SUCCESS",
  ].includes(statusText);

  if (isDeliveredOrPaid) {
    doc.setFillColor(240, 253, 244); // light green
    doc.setDrawColor(187, 247, 208); // green-200 border
    doc.setTextColor(22, 101, 52); // green-800 text
  } else {
    doc.setFillColor(254, 243, 199); // amber
    doc.setDrawColor(253, 230, 138);
    doc.setTextColor(146, 64, 14);
  }
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.2, 1.2, "FD");
  doc.text(statusText, badgeX + badgeWidth / 2, badgeY + 3.8, {
    align: "center",
  });
  rightY += 6.5;

  currentY = Math.max(leftY, rightY) + 6;

  // Divider above table
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 4. Products Table Header
  const colX = {
    image: margin + 2,
    desc: margin + 20,
    qty: 135,
    unitPrice: 160,
    total: pageWidth - margin - 2,
  };

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, "F");

  doc.setFontSize(8);
  doc.setFont(primaryFont, "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("ITEM DESCRIPTION", colX.image, currentY + 5.5);
  doc.text("QTY", colX.qty, currentY + 5.5, { align: "center" });
  doc.text("UNIT PRICE", colX.unitPrice, currentY + 5.5, { align: "right" });
  doc.text("TOTAL", colX.total, currentY + 5.5, { align: "right" });

  currentY += 12;

  // 5. Products Table Rows with Rounded Images (NO outer box border)
  invoice.items.forEach((item, index) => {
    // Check page overflow
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    const rowHeight = 17;
    const itemImg = itemBase64s[index];

    // Product Thumbnail on the Left (Rounded image without outer box border)
    const thumbX = colX.image;
    const thumbY = currentY - 2;
    const thumbSize = 14;

    if (itemImg) {
      try {
        // Draw the clipped rounded image directly with NO border around it
        doc.addImage(
          itemImg.dataUrl,
          "PNG",
          thumbX,
          thumbY,
          thumbSize,
          thumbSize,
        );
      } catch {
        // Fallback icon initial
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(thumbX, thumbY, thumbSize, thumbSize, 2.5, 2.5, "F");
        doc.setFont(primaryFont, "bold");
        doc.setFontSize(8);
        doc.setTextColor(pr, pg, pb);
        doc.text(
          (item.title.charAt(0) || "P").toUpperCase(),
          thumbX + thumbSize / 2,
          thumbY + thumbSize / 2 + 2.5,
          { align: "center" },
        );
      }
    } else {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(thumbX, thumbY, thumbSize, thumbSize, 2.5, 2.5, "F");
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(8);
      doc.setTextColor(pr, pg, pb);
      doc.text(
        (item.title.charAt(0) || "P").toUpperCase(),
        thumbX + thumbSize / 2,
        thumbY + thumbSize / 2 + 2.5,
        { align: "center" },
      );
    }

    // Title & Specs
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(item.title || "Confection Item", 75);
    doc.text(titleLines[0] || item.title, colX.desc, currentY + 3.5);

    if (item.specs) {
      doc.setFont(primaryFont, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.specs, colX.desc, currentY + 8);
    }

    // Qty
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(String(item.quantity || 1), colX.qty, currentY + 5.5, {
      align: "center",
    });

    // Unit Price
    doc.setFont(primaryFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      formatAmount(item.unitPrice, invoice.currency),
      colX.unitPrice,
      currentY + 5.5,
      { align: "right" },
    );

    // Total Line Price
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      formatAmount(item.totalPrice, invoice.currency),
      colX.total,
      currentY + 5.5,
      { align: "right" },
    );

    // Row separator
    currentY += rowHeight;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
  });

  currentY += 4;

  // 6. Totals Box (Right Aligned, Bigger Total Paid Amount)
  const totalsBoxX = 115;
  const totalsWidth = pageWidth - margin - totalsBoxX;

  const totalLines: [string, number, boolean][] = [
    ["Subtotal:", invoice.subtotal, false],
    ["Shipping / Delivery:", invoice.deliveryFee, false],
  ];

  if (invoice.taxAmount && invoice.taxAmount > 0) {
    totalLines.push([
      invoice.taxTitle || "VAT (7.5%):",
      invoice.taxAmount,
      false,
    ]);
  }

  totalLines.push(["Total Paid:", invoice.totalAmount, true]);

  totalLines.forEach(([label, val, isGrandTotal]) => {
    if (isGrandTotal) {
      currentY += 2;
      const grandTotalHeight = 11.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(pr, pg, pb);
      doc.setLineWidth(0.6);
      doc.roundedRect(
        totalsBoxX,
        currentY,
        totalsWidth,
        grandTotalHeight,
        1.5,
        1.5,
        "FD",
      );

      doc.setTextColor(pr, pg, pb);
      doc.setFont(headingFont, "bold");
      doc.setFontSize(10.5);
      doc.text(label, totalsBoxX + 4, currentY + 7.5);
      doc.setFontSize(11.5);
      doc.text(
        formatAmount(val, invoice.currency),
        pageWidth - margin - 4,
        currentY + 7.5,
        { align: "right" },
      );
      currentY += 16;
    } else {
      doc.setFont(primaryFont, "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8.5);
      doc.text(label, totalsBoxX + 3.5, currentY);
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatAmount(val, invoice.currency),
        pageWidth - margin - 3.5,
        currentY,
        { align: "right" },
      );
      currentY += 5.5;
    }
  });

  // 7. Bottom Colored Banner (Both left and right on the EXACT SAME line)
  const footerHeight = 16;
  const footerY = pageHeight - footerHeight;

  doc.setFillColor(pr, pg, pb);
  doc.rect(0, footerY, pageWidth, footerHeight, "F");

  // Inside Bottom Colored Banner: Vertically centered on the exact same baseline
  const textBaselineY = footerY + footerHeight / 2 + 1.2;

  // Left: Thank you message
  doc.setTextColor(255, 255, 255);
  doc.setFont(primaryFont, "bold");
  doc.setFontSize(9);
  doc.text(
    `Thank you for shopping with ${cleanStoreTitle}!`,
    margin,
    textBaselineY,
  );

  // Right: Invoice # and Date on the exact same line
  const displayOrderNumber =
    invoice.orderNumber || invoice.orderReference || "ORDER";
  const dateStr = invoice.orderDate || new Date().toLocaleDateString();

  doc.setFont(primaryFont, "normal");
  doc.setFontSize(8);
  doc.text(
    `Invoice #${displayOrderNumber} • ${dateStr}`,
    pageWidth - margin,
    textBaselineY,
    { align: "right" },
  );

  // Save to file
  const safeFilename = `Invoice-${invoice.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "") || "order"}.pdf`;
  doc.save(safeFilename);
}

/**
 * Triggers standard system print dialog with customized printable view.
 */
export function printInvoice(invoice?: InvoiceData): void {
  if (typeof window === "undefined") return;

  if (!invoice) {
    window.print();
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const cleanStoreTitle = sanitizeStoreName(
    invoice.storeName,
    invoice.tenantSlug,
  ).toUpperCase();

  const itemsHtml = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px;">
        ${
          item.image
            ? `<img src="${item.image}" alt="" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;" />`
            : `<div style="width: 38px; height: 38px; border-radius: 8px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${invoice.primaryColor || "#0f172a"};">${item.title.charAt(0)}</div>`
        }
        <div>
          <strong style="color: #0f172a;">${item.title}</strong>
          ${item.specs ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.specs}</div>` : ""}
        </div>
      </td>
      <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.quantity}</td>
      <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">${formatAmount(item.unitPrice, invoice.currency)}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${formatAmount(item.totalPrice, invoice.currency)}</td>
    </tr>
  `,
    )
    .join("");

  const displayOrderNum =
    invoice.orderNumber || invoice.orderReference || "ORDER";
  const dateStr = invoice.orderDate || new Date().toLocaleDateString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${displayOrderNum}</title>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
          h2, .store-title, .invoice-title { font-family: 'Bricolage Grotesque', sans-serif; }
          .header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
          .logo-box { display: flex; align-items: center; gap: 12px; }
          .logo-img { max-height: 38px; width: auto; max-width: 48px; object-fit: contain; display: block; }
          .grid { display: grid; grid-template-columns: 4fr 6fr; gap: 24px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; }
          .card h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; }
          .totals { width: 300px; margin-left: auto; font-size: 13px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .totals-grand { background: #f8fafc; border: 1.5px solid ${invoice.primaryColor || "#0f172a"}; color: ${invoice.primaryColor || "#0f172a"}; font-weight: bold; padding: 12px 14px; border-radius: 6px; margin-top: 8px; font-size: 15px; font-family: 'Bricolage Grotesque', sans-serif; }
          .footer-banner { margin-top: 40px; background: ${invoice.primaryColor || "#0f172a"}; color: white; padding: 14px 20px; border-radius: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            ${invoice.storeLogoUrl ? `<img src="${invoice.storeLogoUrl}" alt="" class="logo-img" />` : ""}
            <div>
              <h2 class="store-title" style="margin: 0; font-size: 18px; color: #0f172a;">${cleanStoreTitle}</h2>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Store Receipt & Invoice</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title" style="font-size: 22px; font-weight: bold; color: ${invoice.primaryColor || "#0f172a"};">INVOICE</div>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <h4>Billed To</h4>
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${invoice.customerName}</div>
            <div>${invoice.customerEmail}</div>
            ${invoice.customerPhone ? `<div>${invoice.customerPhone}</div>` : ""}
            ${invoice.deliveryAddress ? `<div style="margin-top: 6px;">${invoice.deliveryAddress}</div>` : ""}
          </div>
          <div class="card">
            <h4>Invoice Summary</h4>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="color: #64748b;">Invoice Number:</span>
              <strong style="color: #0f172a; font-size: 13px;">#${displayOrderNum}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="color: #64748b;">Order Date:</span>
              <strong style="color: #0f172a;">${invoice.orderDate}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="color: #64748b;">Payment Gateway:</span>
              <strong style="color: #0f172a;">${invoice.paymentMethod}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span style="color: #64748b;">Payment Status:</span>
              <span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                ${(invoice.paymentStatus || "PAID").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatAmount(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div class="totals-row">
            <span>Shipping / Delivery:</span>
            <span>${formatAmount(invoice.deliveryFee, invoice.currency)}</span>
          </div>
          ${
            invoice.taxAmount && invoice.taxAmount > 0
              ? `<div class="totals-row">
            <span>${invoice.taxTitle || "VAT (7.5%):"}</span>
            <span>${formatAmount(invoice.taxAmount, invoice.currency)}</span>
          </div>`
              : ""
          }
          <div class="totals-row totals-grand">
            <span>Total Paid:</span>
            <span>${formatAmount(invoice.totalAmount, invoice.currency)}</span>
          </div>
        </div>
        <div class="footer-banner">
          <span style="font-weight: bold;">Thank you for shopping with ${cleanStoreTitle}!</span>
          <span>Invoice #${displayOrderNum} • ${dateStr}</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Builds an InvoiceData object from an Order and Tenant model.
 */
export function buildInvoiceFromOrder(
  order: Order,
  tenant?: Tenant | null,
  tenantSlug?: string,
  explicitLogoUrl?: string | null,
): InvoiceData {
  const rawStoreName = tenant?.name || tenantSlug || "Store";
  const storeName = sanitizeStoreName(rawStoreName, tenantSlug);
  const currency = order.currency || tenant?.currency || "NGN";
  const deliveryFee = Number(
    order.metadata_json?.delivery_fee ||
      tenant?.delivery_fee ||
      tenant?.branding_config?.deliveryFee ||
      0,
  );

  const logoUrl =
    explicitLogoUrl ||
    tenant?.branding_config?.logoUrl ||
    (tenant as unknown as { logo_url?: string })?.logo_url ||
    null;

  const items: InvoiceItem[] = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    const specsArr: string[] = [];
    if (item.options && typeof item.options === "object") {
      Object.entries(item.options).forEach(([k, v]) => {
        if (v) specsArr.push(`${k}: ${v}`);
      });
    }
    const itemImg =
      item.image ||
      item.image_url ||
      (Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : null) ||
      null;

    return {
      id: item.product_id || String(idx),
      title: item.product_title || item.title || "Ordered Item",
      specs: specsArr.join(" • "),
      quantity: qty,
      unitPrice: price,
      totalPrice: price * qty,
      image: itemImg,
    };
  });

  const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalAmount = Number(order.total_amount) || subtotal + deliveryFee;

  let deliveryAddressStr = "";
  const rawAddr =
    order.metadata_json?.delivery_address ||
    order.metadata_json?.shipping_address;
  if (typeof rawAddr === "object" && rawAddr !== null) {
    const a = rawAddr as Record<string, unknown>;
    deliveryAddressStr = [
      a.address || a.street || a.line1,
      a.apartment || a.suite || a.line2,
      a.city,
      a.state,
      a.country,
    ]
      .filter(Boolean)
      .join(", ");
  } else if (rawAddr) {
    deliveryAddressStr = String(rawAddr);
  }

  const orderNum = order.gateway_reference || order.id || "ORDER";

  return {
    storeName,
    storeLogoUrl: logoUrl,
    storeEmail: tenant?.store_email || undefined,
    storePhone: tenant?.store_phone || undefined,
    storeAddress: tenant?.store_address || undefined,
    tenantSlug: tenantSlug || tenant?.slug || "store",
    primaryColor: tenant?.branding_config?.primaryColor,
    orderNumber: orderNum,
    orderReference: order.gateway_reference || order.id,
    orderDate: order.created_at
      ? new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : new Date().toLocaleDateString(),
    paymentMethod: order.payment_gateway
      ? order.payment_gateway.toUpperCase() === "STRIPE"
        ? "Stripe Checkout"
        : "Paystack"
      : "Card / Transfer",
    paymentStatus: order.status || "Paid",
    customerName: order.customer_name || "Valued Customer",
    customerEmail: order.customer_email || "",
    customerPhone:
      (order.metadata_json?.phone as string) ||
      (order.metadata_json?.customer_phone as string) ||
      "",
    fulfillmentType: order.metadata_json?.fulfillment_type || "Delivery",
    deliveryDate: order.metadata_json?.fulfillment_date
      ? String(order.metadata_json.fulfillment_date)
      : undefined,
    deliveryAddress: deliveryAddressStr || undefined,
    items,
    subtotal,
    deliveryFee,
    taxAmount: Number(order.tax_amount ?? order.metadata_json?.tax_amount ?? 0),
    taxTitle:
      order.tax_title ||
      (order.metadata_json?.tax_title as string) ||
      "VAT (7.5%)",
    totalAmount,
    currency,
  };
}

/**
 * Builds an InvoiceData object from an OrderDisplay model.
 */
export function buildInvoiceFromOrderDisplay(
  order: OrderDisplay,
  tenantSlug: string,
  storeName?: string,
  customerName?: string,
  customerEmail?: string,
  primaryColor?: string,
  logoUrl?: string | null,
): InvoiceData {
  const cleanStore = sanitizeStoreName(storeName, tenantSlug);

  const items: InvoiceItem[] = order.items.map((it) => ({
    id: it.id,
    title: it.title,
    specs: it.specs,
    quantity: 1,
    unitPrice: it.price,
    totalPrice: it.price,
    image: it.image || null,
  }));

  const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const deliveryFee = Math.max(0, order.totalPayment - subtotal);

  return {
    storeName: cleanStore,
    storeLogoUrl: logoUrl,
    tenantSlug,
    primaryColor,
    orderNumber:
      order.gatewayReference || order.orderNumber || order.id || "ORDER",
    orderReference: order.gatewayReference || order.id,
    orderDate: order.dateValue || new Date().toLocaleDateString(),
    paymentMethod: order.paymentMethod || "Online Payment",
    paymentStatus: order.status || "Paid",
    customerName: customerName || "Valued Customer",
    customerEmail: customerEmail || "",
    items,
    subtotal,
    deliveryFee,
    totalAmount: order.totalPayment,
    currency: order.currency || "NGN",
  };
}
