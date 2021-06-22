// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.4;

import "./Multicall.sol";

/**
 * @dev BrinkVote is a simple balance ledger created for Brink proposal voting on snapshot.org
 *
 * This is not an ERC20 token! It does not fully implement the ERC20 standard. Balances cannot be transfered. Balances
 * can be minted by the owners of the contract. Once a balance is minted it becomes immutable.
 *
 * This contract was created solely for the purpose of vote signaling. It allows Brink community members to broadcast
 * their opinions on Brink protocol development proposals.
 */
contract BrinkVote is Multicall {
  string private constant _symbol = "BVOTE";
  string private constant _name = "Brink Vote";
  uint8 private constant _decimals = 18;
  uint256 private constant _totalSupply = 5_000_000_000_000000000000000000; // 5 Million

  mapping (address => uint256) private _balances;
  mapping (address => bool) private _owners;

  uint256 private _totalGranted;

  modifier onlyOwner() {
    require(_isOwner(msg.sender), "NOT_OWNER");
    _;
  }

  constructor (address initialOwner) {
    _owners[initialOwner] = true;
  }

  function name() external pure returns (string memory) {
      return _name;
  }

  function symbol() external pure returns (string memory) {
    return _symbol;
  }

  function decimals() external pure returns (uint8) {
    return _decimals;
  }

  function totalSupply() external pure returns (uint256) {
    return _totalSupply;
  }

  function totalGranted() external view returns (uint256) {
    return _totalGranted;
  }

  function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
  }

  function isOwner(address owner) external view returns (bool) {
    return _isOwner(owner);
  }

  function grant1000(address account) external onlyOwner() {
    _grant(account, 1_000_000000000000000000);
  }

  function grant2000(address account) external onlyOwner() {
    _grant(account, 2_000_000000000000000000);
  }

  function grant3000(address account) external onlyOwner() {
    _grant(account, 3_000_000000000000000000);
  }

  function addOwner(address owner) external onlyOwner() {
    require(!_isOwner(owner), "ALREADY_OWNER");
    _owners[owner] = true;
  }

  function removeOwner(address owner) external onlyOwner() {
    require(_isOwner(owner), "CANNOT_REMOVE_NON_OWNER");
    require(owner != msg.sender, "CANNOT_REMOVE_SELF_OWNER");
    _owners[owner] = false;
  }

  function _grant(address account, uint256 amount) internal {
    require(_balances[account] == 0, "ACCOUNT_HAS_BALANCE");
    _balances[account] = amount;
    _totalGranted += amount;
    require(!_capExceeded(), "CAP_EXCEEDED");
  }

  function _capExceeded() internal view returns (bool) {
    return _totalGranted > _totalSupply;
  }

  function _isOwner(address owner) internal view returns (bool) {
    return _owners[owner];
  }
}
