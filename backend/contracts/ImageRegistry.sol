// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ImageRegistry
 * @dev Store and verify IPFS CIDs for encrypted images
 * Provides tamper-proof storage on blockchain
 */
contract ImageRegistry {
    // Mapping from image ID to IPFS CID
    mapping(uint256 => string) public imageCIDs;
    
    // Track total number of images stored
    uint256 public imageCount;
    
    // Event emitted when a new CID is stored
    event CIDStored(
        uint256 indexed imageID,
        string cid,
        address indexed uploader,
        uint256 timestamp
    );
    
    /**
     * @dev Store IPFS CID for an image ID
     * @param imageID Unique identifier for the image
     * @param cid IPFS Content Identifier
     */
    function storeCID(uint256 imageID, string memory cid) public {
        require(bytes(cid).length > 0, "CID cannot be empty");
        
        // Store CID
        imageCIDs[imageID] = cid;
        imageCount++;
        
        // Emit event for tracking
        emit CIDStored(imageID, cid, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Retrieve IPFS CID for an image ID
     * @param imageID Unique identifier for the image
     * @return string IPFS CID
     */
    function getCID(uint256 imageID) public view returns (string memory) {
        return imageCIDs[imageID];
    }
    
    /**
     * @dev Check if an image ID exists
     * @param imageID Unique identifier for the image
     * @return bool True if CID exists
     */
    function imageExists(uint256 imageID) public view returns (bool) {
        return bytes(imageCIDs[imageID]).length > 0;
    }
    
    /**
     * @dev Get total number of images stored
     * @return uint256 Total image count
     */
    function getImageCount() public view returns (uint256) {
        return imageCount;
    }
}
