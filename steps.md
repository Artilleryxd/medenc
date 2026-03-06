# How to Start the App

You need to start **4 things** in order. Open a separate terminal for each.

---

## Step 1 — IPFS Daemon

You need IPFS installed (`brew install ipfs` if you don't have it). Then:

```bash
ipfs init        # only needed the first time
ipfs daemon
```

Must be running on `localhost:5001` before the backend starts.

---

## Step 2 — Hardhat Local Blockchain

```bash
cd backend
npm install      # first time only
npm run hardhat:node
```

Starts a local Ethereum node on `localhost:8545` with pre-funded test accounts.

---

## Step 3 — Deploy the Smart Contract

Only needs to be done **once** (or after restarting the Hardhat node, since it resets state):

```bash
cd backend
npm run hardhat:compile
npm run hardhat:deploy
```

The terminal will print the deployed contract address. If it isn't `0x5FbDB2315678afecb367f032d93F642f64180aa3` (the default first deployment), update it manually in `backend/routes/fileRoutes.js` at the `contractAddress` variable.

---

## Step 4 — Backend Server

```bash
cd backend
npm run dev      # uses nodemon, auto-restarts on changes
# or
npm start        # plain node
```

Starts on `localhost:8000`.

---

## Step 5 — Frontend

```bash
cd frontend
npm install      # first time only
npm run dev
```

Starts on `localhost:5173` (Vite default). Open that URL in your browser.

---

## Port Summary

| What         | Port |
|--------------|------|
| IPFS         | 5001 |
| Hardhat node | 8545 |
| Backend API  | 8000 |
| Frontend     | 5173 |
