# 🥭 MangoFlow — Fruit Mandi Order Management System

A prototype order management system built for **Fruit Mandi ** to replace manual WhatsApp order tracking with a streamlined, shareable order form and an admin dashboard.

---

## 🎬 60-Second Video Walkthrough

Watch the full automated 60-second walkthrough (with soothing background music, high resolution, and full scroll centering) showing customer order selection, form submission, and supplier admin dashboard filtering:
👉 **[Watch Video Walkthrough with Music (mangoflow_demo_v2.mp4)](https://github.com/haroon553/fruit-mandi-orders/raw/main/mangoflow_demo_v2.mp4)**

---

## 🚀 How to Run the Application Locally

Since MangoFlow is built using pure vanilla HTML, CSS, and JavaScript with no external dependencies or backend requirements, running it locally is extremely simple.

### Option 1: Using Python (Recommended)
If you are on a Mac, Linux, or Windows machine with Python installed, you can start a local development server in terminal:

1. Open your terminal.
2. Navigate to the project directory:
   ```bash
   cd /MangoFlow
   ```
3. Start the HTTP server:
   ```bash
   # If using Python 3:
   python3 -m http.server 8080
   
   # Or if python3 is not mapped, try:
   python -m http.server 8080
   ```
4. Open your web browser and navigate to:
   - **📱 Customer Order Form**: [http://localhost:8080](http://localhost:8080)
   - **📊 Supplier Dashboard**: [http://localhost:8080/dashboard.html](http://localhost:8080/dashboard.html)

### Option 2: Using VS Code Live Server
If you use Visual Studio Code:
1. Install the **Live Server** extension by Ritwick Dey.
2. Open the `MangoFlow` folder in VS Code.
3. Right-click on `index.html` or `dashboard.html` and select **"Open with Live Server"**.

### Option 3: Using Node.js / npx
If you have Node.js installed, you can use `http-server` or `serve`:
```bash
cd /MangoFlow
npx serve .
```

---

## 🧪 Testing Guide

### 1. Test the Customer Order Flow (`index.html`)
- Open the home page and browse the 4 mango varieties (**Sindhri, Chaunsa, Anwar Ratol, Langra**).
- Click on any mango card to select it.
- Choose between **5kg** and **10kg** box sizes and adjust quantities using the `+` / `-` buttons.
- Notice the live-updating cart summary on the right sidebar (or bottom on mobile).
- Click **"Continue to Details →"** and fill in sample customer information (UK phone format and UK address).
- Click **"Review Order →"** to submit. You will see an order confirmation screen with a generated Order ID (`FM-XXXXX`), payment instructions (bank transfer details), and a direct **"💬 Confirm on WhatsApp"** button.

### 2. Test the Supplier Dashboard (`dashboard.html`)
- Open `dashboard.html`.
- Click the **"🌱 Load Demo Data"** button in the top navigation bar. This will pre-populate the dashboard with **15 realistic demo orders** featuring UK cities (Glasgow, London, Manchester, etc.), Pakistani customer names, and mixed statuses.
- **Filter & Search**: Try searching by customer name, order ID, or city in the search bar. Filter by Order Status (*Pending, Confirmed, Shipped, Delivered*) or Payment Status (*Paid, Unpaid*).
- **Manage Orders**: Click on any Order ID or the eye icon (`👁️`) to open the order details modal. From here, you can change the order status, mark payments as paid/unpaid, delete orders, or click **"💬 WhatsApp Customer"** to send them a direct message.
- **Export Data**: Click **"📥 Export CSV"** to download all filtered orders as a spreadsheet.

---

## 🌐 How to Deploy for Free (To Share with the Supplier!)

When you are ready to demo this, you can deploy it online for free in less than 2 minutes:

### Method A: GitHub Pages (Free & Reliable)
1. Push the `MangoFlow` folder to a new public repository on GitHub.
2. In your repository on GitHub, go to **Settings** → **Pages**.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
4. In a couple of minutes, your site will be live at `https://<your-username>.github.io/<repo-name>/`!

### Method B: Netlify Drop (Instant No-Code Deployment)
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
2. Drag and drop the `MangoFlow` folder directly onto the webpage.
3. Netlify will generate a live HTTPS link instantly that you can share on WhatsApp!

---

## 📁 Project Structure

```text
MangoFlow/
├── index.html              # Customer-facing order form (Mobile-first)
├── dashboard.html          # Supplier command center & admin dashboard
├── css/
│   └── styles.css          # Premium Pakistani-mango themed design system
├── js/
│   ├── storage.js          # localStorage data layer, product catalog & demo seeding
│   ├── order.js            # Customer order form interactivity & validation
│   └── dashboard.js        # Dashboard filtering, stats counter & CSV export
└── assets/
    └── hero.png            # Golden Sindhri mangoes hero image
```
