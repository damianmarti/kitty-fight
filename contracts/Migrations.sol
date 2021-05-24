// SPDX-License-Identifier: MIT
//pragma solidity >=0.4.18 <0.9.0;
pragma solidity ^0.4.18;

contract Migrations {
  address public owner = msg.sender;
  uint public last_completed_migration;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }
}
