// Generates an 8-character order ID using uppercase letters + digits.
// Import and call this wherever a customer-facing order ID is needed.
export function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}