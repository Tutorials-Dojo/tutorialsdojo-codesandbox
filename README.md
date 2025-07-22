# TutorialsDojo CodeSandbox

**CodeBox is a next-generation interactive learning platform that provides users with a secure, fast, and isolated coding environment powered by Firecracker microVMs.**

It's designed to offer a hands-on, "learn-by-doing" experience directly in the browser, similar to CodeSandbox but with a focus on guided tutorials and a lightweight, secure backend architecture.

##  Core Features

*   **Interactive IDE in the Browser**: A rich, VS Code-like editing experience with a file tree, code editor, and preview pane.
*   **Secure & Isolated Runtimes**: Every user session runs within a dedicated Firecracker microVM, ensuring that code execution is completely isolated from the host and other users.
*   **Ultra-Fast Boot Times**: Leverage Firecracker's sub-second boot times to provide on-demand, snappy development environments.
*   **Guided Tutorial System**: (Roadmap) Follow step-by-step instructions that interact with your coding environment to verify your progress.
*   **Real-time Preview**: See your web application changes instantly as you code.

---

## 🚀 Technology Stack

This project uses a modern, scalable tech stack:

| Area           | Technology                                                                                                       | Description                                                                    |
| :------------- | :--------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Frontend**     | [**React**](https://reactjs.org/), [**TypeScript**](https://www.typescriptlang.org/), [**Vite**](https://vitejs.dev/), [**Tailwind CSS**](https://tailwindcss.com/) | A fast, modern, and type-safe single-page application.                         |
| **Backend**      | [**Node.js**](https://nodejs.org/)/[**Express.js**](https://expressjs.com/) with **TypeScript**                      | A high-performance API server to manage projects and orchestrate VMs.            |
| **VM Tech**      | [**Firecracker**](https://firecracker-microvm.github.io/)                                                        | Provides the core virtualization layer for secure and lightweight microVMs.      |
| **Deployment**   | [**Docker**](https://www.docker.com/), [**Terraform**](https://www.terraform.io/), [**Google Cloud (GCP)**](https://cloud.google.com/) | Containerization and Infrastructure as Code for repeatable, scalable deployments.    |
| **Monorepo**     | [**pnpm workspaces**](https://pnpm.io/workspaces)                                                                | Manages dependencies and scripts across the `client`, `server`, and `shared` packages. |

---

## 🧠 Core Concept: The Firecracker Backend

The heart of this project is its use of Firecracker microVMs. Unlike traditional containers (like Docker), Firecracker provides hardware-virtualization-based security and workload isolation.

**Why Firecracker?**
1.  **Security**: VMs provide a much stronger security boundary than containers. Malicious code executed in one VM has no way of affecting the host machine or other VMs. This is critical for a platform that runs untrusted user code.
2.  **Speed**: Firecracker is designed for speed, with a startup time of less than 125ms. This allows us to create and destroy VMs on-demand for each user session without noticeable delay.
3.  **Efficiency**: It has a minimal memory footprint (~5 MiB), allowing us to run thousands of microVMs on a single host, making the platform cost-effective and scalable.

The backend contains the orchestration logic that communicates with the Firecracker process to:
*   Configure and launch new microVMs from a base template.
*   Manage the VM's lifecycle (start, stop, pause, resume).
*   Handle networking and file system access for the running VM.

---

## 🛠️ Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or newer)
*   [pnpm](https://pnpm.io/) (for monorepo management)
*   [Docker](https://www.docker.com/get-started)
*   **(For Full Backend)** A Linux machine with KVM enabled to run Firecracker. You can use a VM on other operating systems.

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/tutorialsdojo-codesandbox.git
    cd tutorialsdojo-codesandbox
    ```

2.  **Install dependencies:**
    This command will install dependencies for all workspaces (`client`, `server`, `shared`).
    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory by copying the example file.
    ```bash
    cp .env.example .env
    ```
    Now, fill in the required variables in the new `.env` file.

4.  **Run the Development Servers:**
    This will concurrently start the React frontend and the Node.js backend server. The frontend will be available at `http://localhost:5173`.
    ```bash
    pnpm dev
    ```

### Deployment (GCP & Terraform)

The `infra/` directory contains the necessary scripts to deploy this application to a production-like environment on Google Cloud.

*   The `terraform/` scripts will provision a GCE instance (with nested virtualization enabled for KVM), VPC networking, and other required resources.
*   The application is containerized using a `Dockerfile` for easy deployment.

**Note:** A full deployment guide will be added as the project matures.

---

## 🗺️ Roadmap

*   [ ] **MVP Core**: Implement file editing, saving, and execution within a Firecracker VM.
*   [ ] **User Authentication**: Allow users to sign up and save their projects.
*   [ ] **Live Terminal**: Implement a WebSocket-based terminal that connects directly to the running microVM.
*   [ ] **Real-time Collaboration**: Allow multiple users to code in the same environment.
*   [ ] **Support for More Languages**: Add templates and runtimes for Python, Go, Rust, etc.
*   [ ] **Database Integration**: Provide services like PostgreSQL or Redis within the user's environment.
*   [ ] **Interactive Tutorial Engine**: Build the system for creating and following guided tutorials.

