const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

const router = express.Router();

router.get("/:orderId/pdf", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Populate customer and product details
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("customer");

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "delivered")
      return res.status(400).json({ error: "Invoice available only for delivered orders" });

    // Ensure invoice directory exists
    const invoicesDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

    const filePath = path.join(invoicesDir, `invoice_${orderId}.pdf`);
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- Register NotoSans font for ₹ support ---
    const fontPath = path.join(__dirname, "../fonts/NotoSans-Regular.ttf");
    doc.registerFont("NotoSans", fontPath);
    doc.font("NotoSans");

    const rupee = "\u20B9";

    // --- AMAZONMART-STYLE HEADER ---
    doc.rect(0, 0, doc.page.width, 60).fill("#232F3E"); // dark blue header

    doc
      .font("NotoSans")
      .fontSize(22)
      .fillColor("#FF9900")
      .text("amazonmart.in", 50, 20);

    doc
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text("Invoice from AmazonMart Pvt. Ltd.", 180, 25, { align: "right" })
      .text("support@amazonmart.in | 1800-123-4567", { align: "right" });

    doc.moveDown(3);

    // --- ORDER INFORMATION ---
    doc
      .fillColor("#111")
      .fontSize(12)
      .text("Order Information", 50, doc.y + 10)
      .moveDown(0.3);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#FF9900");

    doc
      .fontSize(10)
      .fillColor("#333")
      .text(`Order ID: ${order._id}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Delivery Status: ${order.status}`)
      .moveDown(1.5);

    // --- CUSTOMER & SHIPPING INFO ---
    doc
      .fontSize(12)
      .fillColor("#111")
      .text("Billing & Shipping Details", 50, doc.y)
      .moveDown(0.3);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#FF9900");
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor("#333");
    doc.text(`Customer: ${order.customer.name}`, 50, doc.y);
    doc.text(`Email: ${order.customer.email}`, 50, doc.y + 15);
    doc.text(`Phone: ${order.customer.phone || "N/A"}`, 50, doc.y + 30);
    doc.text(`Address: ${order.deliveryAddress}`, 50, doc.y + 45);

    doc.moveDown(2);

    // --- TABLE HEADER ---
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 330;
    const priceX = 400;
    const totalX = 470;

    doc.fillColor("#232F3E").rect(itemX - 5, tableTop - 5, 500, 25).fill();

    doc.fillColor("#FFF")
      .font("NotoSans")
      .fontSize(10)
      .text("Product", itemX, tableTop)
      .text("Qty", qtyX, tableTop)
      .text("Price", priceX, tableTop)
      .text("Total", totalX, tableTop);

    // --- TABLE ROWS ---
    doc.font("NotoSans").fillColor("#000");
    let y = tableTop + 30;

    order.items.forEach(item => {
      const name = item.product?.name || "N/A";
      const qty = item.quantity;
      const price = item.product?.price || 0;
      const total = qty * price;

      // Wrap product name if too long
      doc.text(name, itemX, y, { width: qtyX - itemX - 5 });
      doc.text(qty.toString(), qtyX, y);
      doc.text(`${rupee}${price.toFixed(2)}`, priceX, y);
      doc.text(`${rupee}${total.toFixed(2)}`, totalX, y);

      y += 20;
    });

    // --- GRAND TOTAL ---
    doc.moveTo(itemX - 5, y + 5).lineTo(550, y + 5).stroke("#FF9900");
    doc.font("NotoSans").fontSize(12).fillColor("#111")
      .text(`Grand Total: ${rupee}${order.totalAmount.toFixed(2)}`, totalX - 70, y + 15);

    // --- FOOTER ---
    doc
      .moveDown(3)
      .font("NotoSans")
      .fontSize(9)
      .fillColor("#777")
      .text("Includes all taxes (GST as applicable). This is a system-generated invoice.", { align: "center" })
      .text("Thank you for shopping with AmazonMart!", { align: "center" })
      .text("www.amazonmart.in", { align: "center", link: "https://www.amazonmart.in" });

    doc.end();

    // Send PDF for download
    stream.on("finish", () => {
      res.download(filePath, `invoice_${orderId}.pdf`, err => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).json({ error: "Error downloading the invoice" });
        }
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
