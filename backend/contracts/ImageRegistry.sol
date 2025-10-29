pragma solidity ^0.8.0;

/**
 * @title ImageRegistry
 * @dev Store and verify IPFS CIDs and encrypted AES keys for images
 */
contract ImageRegistry {
    struct ImageData {
        string cid;
        string encryptedKey;
    }
    
    mapping(uint256 => ImageData) public images;
    uint256 public imageCount;
    
    event CIDStored(
        uint256 indexed imageID,
        string cid,
        address indexed uploader,
        uint256 timestamp
    );
    
    /**
     * @dev Store IPFS CID and encrypted AES key
     * @param imageID Unique identifier for the image
     * @param cid IPFS Content Identifier
     * @param encryptedKey RSA-encrypted AES key for decryption
     */
    function storeCID(uint256 imageID, string memory cid, string memory encryptedKey) public {
        require(bytes(cid).length > 0, "CID cannot be empty");
        require(bytes(encryptedKey).length > 0, "Encrypted key cannot be empty");
        
        images[imageID] = ImageData(cid, encryptedKey);
        imageCount++;
        
        emit CIDStored(imageID, cid, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Retrieve CID and encrypted key for an image ID
     * @param imageID Unique identifier for the image
     * @return cid IPFS CID
     * @return encryptedKey Encrypted AES key
     */
    function getImageData(uint256 imageID) public view returns (string memory cid, string memory encryptedKey) {
        return (images[imageID].cid, images[imageID].encryptedKey);
    }
    
    /**
     * @dev Legacy function for backward compatibility
     */
    function getCID(uint256 imageID) public view returns (string memory) {
        return images[imageID].cid;
    }
}
