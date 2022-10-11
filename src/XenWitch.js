import { ethers } from "ethers";
import { XENAddress, XENInterface } from "./XEN";
export const XenWitchABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "XenWitchCreate",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "call",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct XenWitch.Call[]",
        name: "calls",
        type: "tuple[]",
      },
      {
        internalType: "address",
        name: "ref",
        type: "address",
      },
    ],
    name: "callAll",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "contractAddress",
    outputs: [
      {
        internalType: "contract ContractAddress",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "createCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minDonate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "setMinDonate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
export const contractAddress = "0xDF024061Cf701c02Db0E2Df32F160F12a660a396";
export const XenWitchInterface = new ethers.utils.Interface(XenWitchABI);

export const xenWitchContract = {
  addressOrName: contractAddress,
  contractInterface: XenWitchInterface,
};

export const generateMint = (amount, term, offset = 0) => {
  const calls = [];
  for (let i = 0; i < amount; i++) {
    calls.push({
      target: XENAddress,
      data: XENInterface.encodeFunctionData("claimRank", [
        term == 0 ? i + 1 : term,
      ]),
      id: i + offset,
      value: 0,
    });
  }

  return calls;
};

export const generateOneClaim = (id, address) => {
  return {
    target: XENAddress,
    data: XENInterface.encodeFunctionData("claimMintRewardAndShare", [
      address,
      100,
    ]),
    id,
    value: 0,
  };
};

export const generateClaim = (ids, address) => {
  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  const calls = [];
  for (let i = 0; i < ids.length; i++) {
    calls.push({
      target: XENAddress,
      data: XENInterface.encodeFunctionData("claimMintRewardAndShare", [
        address,
        100,
      ]),
      id: ids[i],
      value: 0,
    });
  }

  return calls;
};
