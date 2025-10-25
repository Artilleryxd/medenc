// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ElectronicHealthRecords
 * @dev Smart contract for storing and managing encrypted medical records on blockchain
 * @author RemixAI for academic project use
 */
contract ElectronicHealthRecords {
    // Record structure to store all medical record information
    struct MedicalRecord {
        string ipfsHash; // IPFS hash of encrypted file
        address uploader; // Ethereum address of uploader
        address[] permitted; // List of addresses allowed to access
        uint256 timestamp; // Upload timestamp
    }

    // Mapping from record ID to MedicalRecord struct
    mapping(uint256 => MedicalRecord) private _records;

    // Counter for auto-incrementing record IDs
    uint256 private _recordCount;

    // Event emitted when a new record is added
    event RecordAdded(
        uint256 indexed recordId,
        string ipfsHash,
        address indexed uploader,
        address[] permitted,
        uint256 timestamp
    );

    /**
     * @dev Adds a new medical record to the blockchain
     * @param ipfsHash IPFS hash of the encrypted medical record
     * @param permitted List of addresses allowed to access this record
     */
    function addRecord(
        string memory ipfsHash,
        address[] memory permitted
    ) public {
        _recordCount++;
        _records[_recordCount] = MedicalRecord({
            ipfsHash: ipfsHash,
            uploader: msg.sender,
            permitted: permitted,
            timestamp: block.timestamp
        });

        emit RecordAdded(
            _recordCount,
            ipfsHash,
            msg.sender,
            permitted,
            block.timestamp
        );
    }

    /**
     * @dev Retrieves a medical record by its ID
     * @param recordId The ID of the record to retrieve
     * @return ipfsHash IPFS hash of the encrypted file
     * @return uploader Address of the record uploader
     * @return permitted List of permitted addresses
     * @return timestamp Upload timestamp
     */
    function getRecord(
        uint256 recordId
    )
        public
        view
        returns (
            string memory ipfsHash,
            address uploader,
            address[] memory permitted,
            uint256 timestamp
        )
    {
        MedicalRecord memory record = _records[recordId];
        return (
            record.ipfsHash,
            record.uploader,
            record.permitted,
            record.timestamp
        );
    }

    /**
     * @dev Checks if an address is permitted to access a specific record
     * @param recordId The ID of the record to check
     * @param userAddress The address to check permissions for
     * @return bool True if the address is permitted, false otherwise
     */
    function isPermitted(
        uint256 recordId,
        address userAddress
    ) public view returns (bool) {
        MedicalRecord memory record = _records[recordId];

        // Check if user is uploader (always has access)
        if (record.uploader == userAddress) {
            return true;
        }

        // Check if user is in permitted list
        for (uint256 i = 0; i < record.permitted.length; i++) {
            if (record.permitted[i] == userAddress) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Returns the total number of records stored
     * @return uint256 Total record count
     */
    function getRecordCount() public view returns (uint256) {
        return _recordCount;
    }
}
