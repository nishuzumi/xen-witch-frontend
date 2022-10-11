import { utils } from "ethers";
import { getAddress, keccak256, solidityPack } from "ethers/lib/utils";
import { XenWitchInterface } from "./XenWitch";
const CACreationCode = [
  "0x3d602d80600a3d3981f3363d3d373d3d3d363d73",
  "DaA6A0dAF1179780698e63671C0b23E8e344562A".toLowerCase(),
  "5af43d82803e903d91602b57fd5bf3",
].join("");
export function getContractAddress(address, count) {
  return utils.getAddress(
    `0x${keccak256(
      `0x${[
        "ff",
        contractAddress,
        keccak256(solidityPack(["address", "uint256"], [address, count])),
        keccak256(CACreationCode),
      ]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    ).slice(-40)}`
  );
}

export const contractAddress = "0xDF024061Cf701c02Db0E2Df32F160F12a660a396";
export const notification = {
  insert: "top",
  container: "top-right",
  animationIn: ["animate__animated animate__fadeIn"], // `animate.css v4` classes
  animationOut: ["animate__animated animate__fadeOut"], // `animate.css v4` classes
  dismiss: {
    duration: 5000,
    onScreen: true,
  },
};
const KEY = "2EiFzbjrGf6ELZQi9VMtoBQ88gf";
export const addressesSearcher = async (address, provider) => {
  const header = new Headers();
  header.append("X-API-KEY", KEY);
  header.append("Content-Type", "application/json");

  const txsList = [];
  let page = 1;
  while (page) {
    const result = await fetch(
      `https://api.chainbase.online/v1/account/txs?chain_id=1&address=${address}&contract_address=${contractAddress}&limit=100&page=${page}`,
      {
        method: "GET",
        headers: header,
        redirect: "follow",
      }
    );
    const { data: txsData, next_page } = await result.json();
    if (!txsData) break;
    page = next_page;
    txsList.push(...txsData);
  }

  const tasks = [];
  for (const tx of txsList) {
    tasks.push(provider.getTransactionReceipt(tx["transaction_hash"]));
  }

  const data = await Promise.all(tasks);
  const addresses = new Map();

  // XenWitchInterface.decodeFunctionData('callAll',one.input)
  console.log(data);
  for (let i = 0; i < data.length; i++) {
    if (!txsList[i]["input"].startsWith("0x98f6264")) continue;
    const { calls } = XenWitchInterface.decodeFunctionData(
      "callAll",
      txsList[i]["input"]
    );
    calls.map((call) => {
      addresses.set(
        getAddress(getContractAddress(address, call.id.toNumber())),
        call.id.toNumber()
      );
    });
  }
  return addresses;
};
