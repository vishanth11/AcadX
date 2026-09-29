// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Non-transferable credential receipt. Academic data remains off-chain;
/// only its exact-byte SHA-256 digest and a public metadata reference are stored.
contract AcademicCredentialNFT is ERC721, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct CredentialRecord {
        bytes32 documentSha256;
        bytes32 credentialRef;
        bool revoked;
        uint64 issuedAt;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => CredentialRecord) public records;
    mapping(bytes32 => uint256) public tokenForCredential;

    error NonTransferable();
    error DuplicateCredential();
    error InvalidDigest();
    error UnknownCredential();
    error AlreadyRevoked();

    event CredentialMinted(
        bytes32 indexed credentialRef,
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 documentSha256,
        string metadataURI
    );
    event CredentialRevoked(bytes32 indexed credentialRef, uint256 indexed tokenId, address indexed issuer);

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
        bytes32 credentialRef,
        bytes32 documentSha256,
        string calldata metadataURI
    ) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        if (recipient == address(0) || credentialRef == bytes32(0) || documentSha256 == bytes32(0)) revert InvalidDigest();
        if (tokenForCredential[credentialRef] != 0) revert DuplicateCredential();
        tokenId = _nextTokenId++;
        tokenForCredential[credentialRef] = tokenId;
        records[tokenId] = CredentialRecord(documentSha256, credentialRef, false, uint64(block.timestamp));
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit CredentialMinted(credentialRef, tokenId, recipient, documentSha256, metadataURI);
    }

    function revokeCredential(bytes32 credentialRef) external onlyRole(ISSUER_ROLE) {
        uint256 tokenId = tokenForCredential[credentialRef];
        if (tokenId == 0) revert UnknownCredential();
        if (records[tokenId].revoked) revert AlreadyRevoked();
        records[tokenId].revoked = true;
        emit CredentialRevoked(credentialRef, tokenId, msg.sender);
    }

    function isCredentialValid(bytes32 credentialRef, bytes32 documentSha256) external view returns (bool) {
        uint256 tokenId = tokenForCredential[credentialRef];
        if (tokenId == 0) return false;
        CredentialRecord memory record = records[tokenId];
        return !record.revoked && record.documentSha256 == documentSha256;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ERC-721 holder-to-holder transfers are disabled. Minting remains possible
    // through _safeMint; no public burn endpoint exists.
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
}
