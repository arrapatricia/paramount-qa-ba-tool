# Paramount Workspace — QA & BA Ecosystem Tool 🚀

A modern, centralized web application built for Quality Assurance (QA) and Business Analyst (BA) teams at **Paramount Life & General Insurance Corp.** This tool streamlines system directory tracking, project requirements specification, document version snapshots, standardized testing workflows, and automated testing guidelines.

---

## 🌟 Key Features

* **Systems & Applications Directory:** Centralized catalog of all production, staging, and development web portals (Paramount Direct, OFW Insurance, GTP, CTPL, Corporate, etc.).
* **Requirements & BRD Management:** In-browser documentation workspace with rich-text visual editing, HTML code mode, and custom document tagging.
* **Auto-Incrementing Version Snapshots & Rollback:** Incremental baseline version control (`v1.0`, `v2.0`) with release notes and instant historical rollback capabilities.
* **QA & BA Onboarding Guide:** 
  * Interactive directory of environment URLs.
  * Insurance Product & Agent reference matrix.
  * Standardized QA testing lifecycle workflows (Alpha vs. Staging testing phases).
  * Gherkin (BDD) test scenario syntax and execution templates.
  * Copy-ready **Playwright** end-to-end automation setup & scripts.
* **Role-Based Access Control (RBAC):** Passlib/Bcrypt encrypted authentication with permissions for Admin, QA, and BA roles.
* **Liquid Glassmorphism UI:** Built with Tailwind CSS supporting a smooth Dark/Light mode toggle.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
* **Framework:** React + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (Glassmorphism design system)
* **HTTP Client:** Axios
* **Deployment:** Vercel

### **Backend**
* **Framework:** FastAPI (Python)
* **Server:** Uvicorn (ASGI)
* **Database / ORM:** SQLAlchemy
* **Security:** Passlib & Bcrypt (`bcrypt==4.0.1`)
* **Deployment:** Railway

---

## 🚀 Getting Started Locally

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Python](https://www.python.org/) (v3.10 or higher)
* Git

---

### **1. Clone the Repository**

```bash
git clone [https://github.com/your-username/qa-ba-tool.git](https://github.com/your-username/qa-ba-tool.git)
cd qa-ba-tool
