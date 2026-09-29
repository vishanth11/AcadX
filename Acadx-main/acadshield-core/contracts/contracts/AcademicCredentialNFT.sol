// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Non-transferable credential receipt. Academic data remains off-chain;
/// only its exact-byte SHA-256 digest and a public metadata reference are stored.
contract AcademicCredentialNFT is ERC721, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct CredentialRecord {
        uint256 tokenId;
        string credentialId;
        string documentHash;
        address issuer;
        address holder;
        string metadataURI;
        bool revoked;
        uint64 issuedAt;
        bytes32 credentialRef;
        bytes32 documentSha256;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => CredentialRecord) public records;
    mapping(bytes32 => uint256) public tokenForCredential;
    mapping(string => uint256) public tokenForCredentialId;

    error NonTransferable();
    error DuplicateCredential();
    error InvalidDigest();
    error UnknownCredential();
    error AlreadyRevoked();

    event CredentialMinted(
        uint256 indexed tokenId,
        string credentialId,
        address indexed issuer,
        address indexed holder,
        string documentHash
    );
    event CredentialRevoked(
        uint256 indexed tokenId,
        string credentialId,
        address indexed issuer
    );

    constructor(address admin) ERC721("AcadShield Academic Credential", "ACAD") {
        require(admin != address(0), "admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function authorizeIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(issuer != address(0), "issuer is zero address");
        _grantRole(ISSUER_ROLE, issuer);
    }

    function revokeIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, issuer);
    }

    function mintCredential(
        address recipient,
        string calldata credentialId,
        string calldata documentHash,
        string calldata metadataURI
    ) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        if (recipient == address(0) || bytes(credentialId).length == 0 || bytes(documentHash).length == 0) revert InvalidDigest();
        bytes32 credRef = keccak256(bytes(credentialId));
        if (tokenForCredential[credRef] != 0 || tokenForCredentialId[credentialId] != 0) revert DuplicateCredential();
        tokenId = _nextTokenId++;
        tokenForCredential[credRef] = tokenId;
        tokenForCredentialId[credentialId] = tokenId;
        bytes32 docDigest = keccak256(bytes(documentHash));

        records[tokenId] = CredentialRecord({
            tokenId: tokenId,
            credentialId: credentialId,
            documentHash: documentHash,
            issuer: msg.sender,
            holder: recipient,
            metadataURI: metadataURI,
            revoked: false,
            issuedAt: uint64(block.timestamp),
            credentialRef: credRef,
            documentSha256: docDigest
        });

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit CredentialMinted(tokenId, credentialId, msg.sender, recipient, documentHash);
    }

    function mintCredential(
        address recipient,
        bytes32 credentialRef,
        bytes32 documentSha256,
        string calldata metadataURI
    ) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        if (recipient == address(0) || credentialRef == bytes32(0) || documentSha256 == bytes32(0)) revert InvalidDigest();
        if (tokenForCredential[credentialRef] != 0) revert DuplicateCredential();
        tokenId = _nextTokenId++;
        tokenForCredential[credentialRef] = tokenId;

        string memory credIdStr = _toHexString(uint256(credentialRef), 32);
        string memory docHashStr = _toHexString(uint256(documentSha256), 32);
        tokenForCredentialId[credIdStr] = tokenId;

        records[tokenId] = CredentialRecord({
            tokenId: tokenId,
            credentialId: credIdStr,
            documentHash: docHashStr,
            issuer: msg.sender,
            holder: recipient,
            metadataURI: metadataURI,
            revoked: false,
            issuedAt: uint64(block.timestamp),
            credentialRef: credentialRef,
            documentSha256: documentSha256
        });

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit CredentialMinted(tokenId, credIdStr, msg.sender, recipient, docHashStr);
    }

    function revokeCredential(string calldata credentialId) external onlyRole(ISSUER_ROLE) {
        bytes32 credRef = keccak256(bytes(credentialId));
        uint256 tokenId = tokenForCredential[credRef];
        if (tokenId == 0) tokenId = tokenForCredentialId[credentialId];
        if (tokenId == 0) revert UnknownCredential();
        if (records[tokenId].revoked) revert AlreadyRevoked();
        records[tokenId].revoked = true;
        emit CredentialRevoked(tokenId, credentialId, msg.sender);
    }

    function revokeCredential(bytes32 credentialRef) external onlyRole(ISSUER_ROLE) {
        uint256 tokenId = tokenForCredential[credentialRef];
        if (tokenId == 0) revert UnknownCredential();
        if (records[tokenId].revoked) revert AlreadyRevoked();
        records[tokenId].revoked = true;
        emit CredentialRevoked(tokenId, records[tokenId].credentialId, msg.sender);
    }

    function isCredentialValid(string calldata credentialId, string calldata documentHash) external view returns (bool) {
        bytes32 credRef = keccak256(bytes(credentialId));
        uint256 tokenId = tokenForCredential[credRef];
        if (tokenId == 0) tokenId = tokenForCredentialId[credentialId];
        if (tokenId == 0) return false;
        CredentialRecord memory record = records[tokenId];
        if (record.revoked) return false;
        return (keccak256(bytes(record.documentHash)) == keccak256(bytes(documentHash)));
    }

    function isCredentialValid(bytes32 credentialRef, bytes32 documentSha256) external view returns (bool) {
        uint256 tokenId = tokenForCredential[credentialRef];
        if (tokenId == 0) return false;
        CredentialRecord memory record = records[tokenId];
        if (record.revoked) return false;
        return record.documentSha256 == documentSha256 || keccak256(bytes(record.documentHash)) == keccak256(bytes(_toHexString(uint256(documentSha256), 32)));
    }

    function getCredentialRecord(uint256 tokenId) external view returns (CredentialRecord memory) {
        _requireOwned(tokenId);
        return records[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _credentialURI[tokenId];
    }

    mapping(uint256 => string) private _credentialURI;

    function _setTokenURI(uint256 tokenId, string calldata uri) private {
        _credentialURI[tokenId] = uri;
    }

    function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_DIGITS[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }

    bytes16 private constant _HEX_DIGITS = "0123456789abcdef";
}
