import { BigNumber, utils } from "ethers";
import { getAddress, keccak256, solidityPack } from "ethers/lib/utils";
import { XenWitchInterface, contractAddress } from "./XenWitch";
import {fromBn,toBn} from "evm-bn"
import BN from 'bn.js';
const CACreationCode = '0x3d602980600a3d3981f3363d3d373d3d3d363d6fc34eF4698F3647f8c65696796d4500955af43d82803e903d91602757fd5bf3'
export const getContractAddressCreate2 = (address, count) => {
  return utils.getAddress(
    `0x${keccak256(
      `0x${[
        "ff",
        contractAddress,
        keccak256(solidityPack(["address", "uint32"], [address, count])),
        keccak256(CACreationCode),
      ]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    ).slice(-40)}`
  );
}

const SECONDS_IN_DAY = 86400
const WITHDRAWAL_WINDOW_DAYS = 7
const MAX_PENALTY_PCT = 99

export const calculateMintReward = (globalRank, info) => {
  if (!globalRank) return 0
  console.log(globalRank,info)
  const {
    rank,
    term,
    maturityTs,
    amplifier,
    eaaRate
  } = info
  const secsLate = Math.floor((+new Date) / 1000) - maturityTs;
  const penalty = _penalty(secsLate);
  const rankDelta = BigNumber.from( globalRank - rank.toNumber() > 2? globalRank - rank.toNumber() : 2);
  const EAA = eaaRate.add(1000);
  const reward = getGrossReward(rankDelta, amplifier, term, EAA);
  return (reward * (100 - penalty)) / 100;
}

function _penalty(secsLate) {
  // =MIN(2^(daysLate+3)/window-1,99)
  const daysLate = secsLate / SECONDS_IN_DAY;
  if (daysLate > WITHDRAWAL_WINDOW_DAYS - 1) return MAX_PENALTY_PCT;
  const penalty = (1 << (daysLate + 3)) / WITHDRAWAL_WINDOW_DAYS - 1;
  return Math.min(penalty, MAX_PENALTY_PCT);
}

function getGrossReward(delta, amplifier, term, eaa) {
  return Math.floor(term * Math.log2(Math.max(delta, 2)) * amplifier * eaa / 1000);
}
