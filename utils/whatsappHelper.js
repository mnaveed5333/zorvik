import { getColorName } from "@/utils/colorNames";

// Builds a wa.me link (with prefilled message) so a CUSTOMER can message a VENDOR
// Used at checkout time.
export const buildWhatsappLink = (vendorWhatsappNumber, orderDetails) => {
  const cleanNumber = vendorWhatsappNumber.replace(/[^0-9]/g, "");

  const { orderId, items, customerName, customerWhatsapp, totalAmount } = orderDetails;

  let message = `*New Order - Zorvik*%0A`;
  message += `*Order ID:* ${orderId}%0A%0A`;
  message += `*Customer Name:* ${customerName}%0A`;
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - Qty: ${item.quantity} - Rs.${item.price}`;
    if (item.variant?.size) message += ` - Size: ${item.variant.size}`;
    if (item.variant?.color) message += ` - Color: ${getColorName(item.variant.color)}`;
    message += `%0A`;
  });
  message += `%0A*Total: Rs.${totalAmount}*%0A`;
  message += `*Customer WhatsApp:* ${customerWhatsapp}`;

  return `https://wa.me/${cleanNumber}?text=${message}`;
};

// Builds a wa.me link (with prefilled message) so a VENDOR or ADMIN can message the CUSTOMER
// Used on vendor orders page and admin orders page.
export const buildCustomerContactLink = (customerWhatsappNumber, order) => {
  const cleanNumber = customerWhatsappNumber.replace(/[^0-9]/g, "");

  const message = `Hi ${order.customerName || "there"}, regarding your order #${order.orderId} (Rs.${order.totalAmount}) placed on Zorvik.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

// Builds a wa.me link (no message) so an ADMIN can message a VENDOR about an order
export const buildVendorContactLink = (vendorWhatsappNumber, order) => {
  const cleanNumber = vendorWhatsappNumber.replace(/[^0-9]/g, "");

  const message = `Hi, regarding order #${order.orderId} from ${order.customerName || "a customer"}. Customer WhatsApp: ${order.customerWhatsapp || "Not provided"}.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

// Builds a wa.me link so an ADMIN can message a CUSTOMER who submitted a contact query
export const buildQueryContactLink = (query) => {
  const cleanNumber = query.whatsappNumber.replace(/[^0-9]/g, "");
  const message = `Hi ${query.name || "there"}, thanks for reaching out to Zorvik regarding: "${query.message}"`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
};

// Splits cart items by vendor, returns an array of per-vendor order objects
export const splitCartByVendor = (cartItems) => {
  const grouped = {};

  cartItems.forEach((item) => {
    const vendorId = item.vendorId;
    if (!grouped[vendorId]) {
      grouped[vendorId] = {
        vendorId,
        vendorWhatsapp: item.vendorWhatsapp,
        items: [],
        totalAmount: 0,
      };
    }
    grouped[vendorId].items.push({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variant: item.variant || {},
    });
    grouped[vendorId].totalAmount += item.price * item.quantity;
  });

  return Object.values(grouped);
};