// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";

import "openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol";
import "openzeppelin/proxy/transparent/ProxyAdmin.sol";
import "openzeppelin/utils/Strings.sol";

contract WithFileHelpers is Script {
    using stdJson for string;
    using Strings for *;

    string constant ROOT = "root";
    string constant PROXY = "proxy";

    string _network;
    string _contractsPath;
    string _constantsPath;

    function testMock_WithDeploymentHelpers() public {}

    struct ProxyGroup {
        address delegator;
        address implementation;
    }

    /// @dev network has to be set as the path for contracts and constants depends on it
    function setNetwork(string memory network_) public {
        _network = network_;
        _contractsPath = string.concat(vm.projectRoot(), "/deployments/", _network, "_contracts.json");
        _constantsPath = string.concat(vm.projectRoot(), "/deployments/", _network, "_constants.json");
    }

    function _getAddress(string memory name) internal view returns (address _address) {
        (_address,) = _getAddressAndIsProxy(name);
    }

    function _getAddressAndIsProxy(string memory name) internal view returns (address, bool) {
        string memory json = vm.readFile(_contractsPath);
        bytes memory data = json.parseRaw(string.concat(".", name));
        if (data.length > keccak256("").length) {
            ProxyGroup memory proxy = abi.decode(data, (ProxyGroup));
            return (proxy.delegator, true);
        }
        return (abi.decode(data, (address)), false);
    }

    function _deployProxy(address implementation, ProxyAdmin proxyAdmin) internal returns (address) {
        TransparentUpgradeableProxy proxy =
            new TransparentUpgradeableProxy(address(implementation), address(proxyAdmin), "");
        return address(proxy);
    }

    /// @dev Test cases that build on the deployment of the contracts use networks that do not have
    /// constants files. So we need to fallback to the local constants file.
    function _getConstant(string memory name) internal view returns (address) {
        string memory json;

        try vm.readFile(_constantsPath) returns (string memory _json) {
            json = _json;
        } catch {
            json = vm.readFile(string.concat(vm.projectRoot(), "/deployments/constants.", "local", ".json"));
        }
        bytes memory data = json.parseRaw(string.concat(".", name));
        return abi.decode(data, (address));
    }

    function _startJson() internal {
        _writeJson("network", _network);
        _writeJson("startBlock", block.number == 0 ? 0 : block.number - 1);
    }

    function _writeJson(string memory key, string memory value) internal {
        string memory json = vm.serializeString(ROOT, key, value);
        vm.writeJson(json, _contractsPath);
    }

    function _writeJson(string memory key, uint256 value) internal {
        string memory json = vm.serializeUint(ROOT, key, value);
        vm.writeJson(json, _contractsPath);
    }

    function _writeJson(string memory key, address value) internal {
        string memory json = vm.serializeAddress(ROOT, key, value);
        vm.writeJson(json, _contractsPath);
    }

    function _writeJson(string memory key, address value, string memory path) internal {
        string memory json = vm.serializeAddress(ROOT, key, value);
        vm.writeJson(json, path);
    }

    function _writeJson(string memory key, address proxy, address implementation) internal {
        // create the inner JSON object
        string memory innerJson;
        innerJson = vm.serializeAddress(PROXY, "implementation", implementation);
        innerJson = vm.serializeAddress(PROXY, "delegator", proxy);

        // add the inner object to the JSON file
        string memory json = ROOT.serialize(key, innerJson);

        // write the JSON file
        vm.writeJson(json, _contractsPath);
    }

    function _upgradeJson(string memory key, address proxy, address implementation) internal {
        // create the inner JSON object
        string memory innerJson;
        innerJson = vm.serializeAddress(PROXY, "implementation", implementation);
        innerJson = vm.serializeAddress(PROXY, "delegator", proxy);

        // replace the inner object in the JSON file
        vm.writeJson(innerJson, _contractsPath, string.concat(".", key));
    }
}
