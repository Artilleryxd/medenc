# 🔄 System Flow Diagrams

## Visual Guide to Understanding the Application

---

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│                      (Web Browser)                            │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                    FRONTEND (React)                           │
│  ┌─────────────┐              ┌──────────────┐              │
│  │   Upload    │              │   Receive    │              │
│  │    Page     │◄────────────►│    Page      │              │
│  └─────────────┘   Router     └──────────────┘              │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ Axios HTTP Requests
                        │
┌───────────────────────▼──────────────────────────────────────┐
│              BACKEND (Node.js + Express)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │   Services   │  │   Crypto     │      │
│  │              │  │              │  │              │      │
│  │ - /upload    │──│ - IPFS       │  │ - AES Enc    │      │
│  │ - /receive   │  │ - Blockchain │  │ - RSA Enc    │      │
│  │ - /all-imgs  │  │ - Key Mgmt   │  │ - Decrypt    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │                  │                  │
    ┌─────▼─────┐      ┌────▼────┐      ┌─────▼─────┐
    │  File     │      │  IPFS   │      │ Ethereum  │
    │  System   │      │ Daemon  │      │ Hardhat   │
    │  (keys/)  │      │ :5001   │      │  :8545    │
    └───────────┘      └────┬────┘      └─────┬─────┘
                            │                  │
                      ┌─────▼──────┐     ┌─────▼──────┐
                      │ Encrypted  │     │   Smart    │
                      │   Files    │     │  Contract  │
                      │(Content ID)│     │(Image CIDs)│
                      └────────────┘     └────────────┘
```

---

## 2. Upload Process - Step by Step

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ 1. User selects     │
│    image file       │
│    in frontend      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 2. Generate unique  │
│    imageID          │
│    (timestamp)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 3. Create FormData  │
│    - image file     │
│    - imageID        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 4. POST to          │
│    /api/upload      │
└─────────┬───────────┘
          │
          ▼
     ┌────────────────────────┐
     │    BACKEND PROCESSING   │
     │                        │
     │  ┌─────────────────┐  │
     │  │ 5. Receive file │  │
     │  │    via Multer   │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │ 6. Encrypt with │  │
     │  │    AES-256-CBC  │  │
     │  │    (Symmetric)  │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │ 7. Upload to    │  │
     │  │    IPFS daemon  │  │
     │  │    via HTTP API │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │ 8. Receive CID  │  │
     │  │    (Hash of     │  │
     │  │    encrypted    │  │
     │  │    file)        │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │ 9. Call smart   │  │
     │  │    contract     │  │
     │  │    storeCID()   │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │10. Wait for TX  │  │
     │  │    to be mined  │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │11. Encrypt AES  │  │
     │  │    key with RSA │  │
     │  │    public key   │  │
     │  └────────┬────────┘  │
     │           │            │
     └───────────┼────────────┘
                 │
                 ▼
┌──────────────────────────┐
│ 12. Return to frontend:  │
│     - imageID            │
│     - CID                │
│     - encryptedAESKey    │
│     - transactionHash    │
└─────────┬────────────────┘
          │
          ▼
┌─────────────────────┐
│ 13. Display in grid │
│     with metadata   │
│     and copy buttons│
└─────────┬───────────┘
          │
          ▼
     ┌────────┐
     │  END   │
     └────────┘
```

---

## 3. Receive/Decrypt Process - Step by Step

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ 1. User navigates   │
│    to Receive page  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 2. useEffect hook   │
│    triggers on      │
│    component mount  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 3. GET request to   │
│    /api/all-images  │
└─────────┬───────────┘
          │
          ▼
     ┌────────────────────────┐
     │    BACKEND PROCESSING   │
     │                        │
     │  ┌─────────────────┐  │
     │  │ 4. Query smart  │  │
     │  │    contract for │  │
     │  │    all CIDStored│  │
     │  │    events       │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │ 5. Extract data │  │
     │  │    from events: │  │
     │  │    - imageID    │  │
     │  │    - cid        │  │
     │  │    - uploader   │  │
     │  │    - timestamp  │  │
     │  │    - txHash     │  │
     │  └────────┬────────┘  │
     │           │            │
     └───────────┼────────────┘
                 │
                 ▼
┌──────────────────────────┐
│ 6. Return array of       │
│    all images            │
└─────────┬────────────────┘
          │
          ▼
┌─────────────────────┐
│ 7. Frontend stores  │
│    images in state  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 8. Display grid of  │
│    image cards with │
│    metadata         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 9. User clicks      │
│    "Decrypt & View" │
│    on an image      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│10. GET request to   │
│    /api/get-image/  │
│    :imageID/:cid    │
└─────────┬───────────┘
          │
          ▼
     ┌────────────────────────┐
     │    BACKEND PROCESSING   │
     │                        │
     │  ┌─────────────────┐  │
     │  │11. Call smart   │  │
     │  │    contract     │  │
     │  │    getCID(id)   │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │12. Compare      │  │
     │  │    stored CID   │  │
     │  │    with provided│  │
     │  │    CID          │  │
     │  └────────┬────────┘  │
     │           │            │
     │      ┌────▼────┐       │
     │      │ Match?  │       │
     │      └─┬─────┬─┘       │
     │        │     │          │
     │    YES │     │ NO       │
     │        │     │          │
     │        │     ▼          │
     │        │  ┌──────────┐ │
     │        │  │ Throw    │ │
     │        │  │ "Tampered"│ │
     │        │  │ Error!   │ │
     │        │  └──────────┘ │
     │        │                │
     │        ▼                │
     │  ┌─────────────────┐  │
     │  │13. Fetch from   │  │
     │  │    IPFS using   │  │
     │  │    CID          │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │14. Receive      │  │
     │  │    encrypted    │  │
     │  │    file buffer  │  │
     │  └────────┬────────┘  │
     │           │            │
     │           ▼            │
     │  ┌─────────────────┐  │
     │  │15. Decrypt with │  │
     │  │    permanent    │  │
     │  │    AES key      │  │
     │  └────────┬────────┘  │
     │           │            │
     └───────────┼────────────┘
                 │
                 ▼
┌──────────────────────────┐
│16. Return decrypted      │
│    image as blob         │
│    (Content-Type: image) │
└─────────┬────────────────┘
          │
          ▼
┌─────────────────────┐
│17. Create object URL│
│    from blob        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│18. Display image in │
│    card, disable    │
│    button, show ✅  │
└─────────┬───────────┘
          │
          ▼
     ┌────────┐
     │  END   │
     └────────┘
```

---

## 4. Cryptography Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    ENCRYPTION SIDE                        │
└──────────────────────────────────────────────────────────┘

Original Image (500 KB)
        │
        │ Step 1: AES-256-CBC Encryption
        │         Uses: Permanent AES Key (32 bytes)
        │               Permanent IV (16 bytes)
        │
        ▼
Encrypted Image (500 KB)
        │
        │ Step 2: Content Addressing
        │         IPFS generates SHA-256 hash
        │
        ▼
CID: Qmanu3BZk... (46 characters)
        │
        │ Step 3: Blockchain Storage
        │         Store imageID → CID mapping
        │
        ▼
Blockchain Record (Immutable)
┌───────────────────────────┐
│ imageID: 1761401440039    │
│ cid: Qmanu3BZk...         │
│ uploader: 0xf39Fd6e...    │
│ timestamp: 1761401440     │
└───────────────────────────┘


Permanent AES Key (32 bytes)
        │
        │ Step 4: RSA Encryption
        │         Uses: RSA Public Key (2048-bit)
        │
        ▼
Encrypted AES Key (256 bytes, base64)
        │
        │ Step 5: Send to Frontend
        │
        ▼
User receives encrypted key
(Can be stored or shared)


┌──────────────────────────────────────────────────────────┐
│                   DECRYPTION SIDE                         │
└──────────────────────────────────────────────────────────┘

User provides:
  - imageID
  - CID
  - Encrypted AES Key (optional in our system)
        │
        │ Step 1: Blockchain Verification
        │
        ▼
Query blockchain: getCID(imageID)
        │
        ▼
Compare: storedCID === providedCID
        │
        ├─── NO ──► ❌ Error: "File tampered!"
        │
        └─── YES
             │
             │ Step 2: IPFS Retrieval
             │
             ▼
Fetch encrypted file from IPFS using CID
             │
             ▼
Encrypted Image (500 KB)
             │
             │ Step 3: AES Decryption
             │         Uses: Permanent AES Key
             │
             ▼
Original Image (500 KB)
             │
             │ Step 4: Send to User
             │
             ▼
Display in browser ✅
```

---

## 5. Data Security Layers

```
┌──────────────────────────────────────────────────────────┐
│                     LAYER 1: ENCRYPTION                   │
│                                                           │
│  Original Image  ──► AES-256-CBC ──► Encrypted Image     │
│                                                           │
│  Protection: Data is unreadable without AES key          │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 2: DECENTRALIZED STORAGE               │
│                                                           │
│  Encrypted Image ──► IPFS ──► Distributed Storage        │
│                                                           │
│  Protection: No single point of failure                  │
│              Content-addressed (CID)                     │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 3: BLOCKCHAIN IMMUTABILITY             │
│                                                           │
│  CID + imageID ──► Smart Contract ──► Immutable Record   │
│                                                           │
│  Protection: Cannot alter historical records             │
│              Tamper detection via CID verification       │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│              LAYER 4: KEY ENCRYPTION                      │
│                                                           │
│  AES Key ──► RSA-2048 ──► Encrypted Key (for transfer)   │
│                                                           │
│  Protection: Secure key exchange                         │
│              Only backend has private key                │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                                                              │
│  ┌─────────────────┐              ┌────────────────────┐   │
│  │  UploadPage     │              │   ReceivePage      │   │
│  │  ├─ Multi       │              │   ├─ useEffect     │   │
│  │  │  Uploader    │              │   │  (auto-fetch)  │   │
│  │  └─ ImageGrid   │              │   └─ ImageCard     │   │
│  └──────┬──────────┘              └─────────┬──────────┘   │
│         │                                    │              │
│         │ POST /upload                       │ GET /all    │
│         │ (FormData)                         │ GET /get    │
└─────────┼────────────────────────────────────┼──────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND ROUTES                          │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ POST /upload     │  │ GET /all-images  │               │
│  │ - Multer         │  │ GET /get-image   │               │
│  │ - encryptFile    │  │ - verifyCID      │               │
│  │ - uploadIPFS     │  │ - getFromIPFS    │               │
│  │ - storeCID       │  │ - decryptFile    │               │
│  └────────┬─────────┘  └─────────┬────────┘               │
│           │                      │                         │
└───────────┼──────────────────────┼─────────────────────────┘
            │                      │
            ▼                      ▼
┌────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │ cryptoUtils │  │ ipfsService │  │  keyManager  │      │
│  │             │  │             │  │              │      │
│  │ - encrypt   │  │ - upload    │  │ - loadAES    │      │
│  │ - decrypt   │  │ - retrieve  │  │ - loadRSA    │      │
│  │ - encryptKey│  │ - testConn  │  │ - generate   │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘      │
│         │                │                 │              │
└─────────┼────────────────┼─────────────────┼──────────────┘
          │                │                 │
          │                │                 │
          ▼                ▼                 ▼
┌──────────────┐  ┌────────────┐  ┌──────────────┐
│ Node crypto  │  │ IPFS HTTP  │  │ File System  │
│   module     │  │    API     │  │   (keys/)    │
└──────────────┘  └────────────┘  └──────────────┘
```

---

## 7. Error Handling Flow

```
                    ┌────────────┐
                    │  Request   │
                    └─────┬──────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Validation    │
                  └───┬───────┬───┘
                      │       │
              ✅ PASS │       │ ❌ FAIL
                      │       │
                      │       └──► "Missing imageID"
                      │            "No file provided"
                      │            "Invalid format"
                      │
                      ▼
            ┌─────────────────┐
            │ Encryption      │
            └────┬────────┬───┘
                 │        │
         ✅ PASS │        │ ❌ FAIL
                 │        │
                 │        └──► "Encryption failed"
                 │             "Invalid buffer"
                 │
                 ▼
        ┌────────────────────┐
        │ IPFS Upload        │
        └────┬───────────┬───┘
             │           │
     ✅ PASS │           │ ❌ FAIL
             │           │
             │           └──► "IPFS daemon not running"
             │                "Upload timeout"
             │                "Network error"
             │
             ▼
    ┌────────────────────────┐
    │ Blockchain Transaction │
    └────┬──────────────┬────┘
         │              │
  ✅ PASS│              │ ❌ FAIL
         │              │
         │              └──► "Contract not deployed"
         │                   "Transaction failed"
         │                   "Gas limit exceeded"
         │
         ▼
┌────────────────┐
│ Success! ✅    │
│ Return data    │
└────────────────┘


        DECRYPTION ERROR FLOW
        ═════════════════════

                ┌──────────────┐
                │ Decrypt Req  │
                └──────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
            │ CID Verification │
            └───┬──────────┬───┘
                │          │
        ✅ MATCH│          │ ❌ MISMATCH
                │          │
                │          └──► "File tampered!"
                │               "CID mismatch"
                │               [CRITICAL ERROR]
                │
                ▼
        ┌───────────────┐
        │ IPFS Retrieval│
        └───┬───────┬───┘
            │       │
    ✅ PASS │       │ ❌ FAIL
            │       │
            │       └──► "File not found on IPFS"
            │            "CID invalid"
            │            "Timeout"
            │
            ▼
    ┌───────────────┐
    │  Decryption   │
    └───┬───────┬───┘
        │       │
✅ PASS │       │ ❌ FAIL
        │       │
        │       └──► "Decryption failed"
        │            "Corrupted data"
        │            "Wrong key"
        │
        ▼
┌─────────────┐
│ Success! ✅ │
│ Return img  │
└─────────────┘
```

---

## 8. State Management (Frontend)

```
┌────────────────────────────────────────────────────────┐
│                   UploadPage State                      │
└────────────────────────────────────────────────────────┘

useState: uploadedImages
  │
  ├─ Initial: []
  ├─ After upload: [{ imageID, cid, encryptedKey, txHash }]
  └─ Rendered in: <ImageGrid images={uploadedImages} />


┌────────────────────────────────────────────────────────┐
│                  ReceivePage State                      │
└────────────────────────────────────────────────────────┘

useState: images
  │
  ├─ Initial: []
  ├─ After fetch: [{ imageID, cid, uploader, timestamp }]
  └─ Rendered in: <ImageCard> components

useState: decryptedImages
  │
  ├─ Initial: {}
  ├─ After decrypt: { "1761401440039": "blob:http://..." }
  └─ Used to show decrypted image in card

useState: decryptingIds
  │
  ├─ Initial: Set()
  ├─ During decrypt: Set(["1761401440039"])
  └─ Used to show loading state on button

useState: loading
  │
  ├─ true: Show spinner
  └─ false: Show content

useState: error
  │
  └─ Display error message if present
```

---

## Summary

This document provides visual representations of:
✅ System architecture
✅ Upload process flow
✅ Decrypt process flow
✅ Cryptography layers
✅ Security model
✅ Component interactions
✅ Error handling
✅ State management

These diagrams should help you understand and explain how the entire system works!

