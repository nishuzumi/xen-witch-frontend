import { atom, selector } from "recoil";
export const GlobalAddresses = atom({
  key: "GlobalAddresses",
  default: new Map(),
});

export const GlobalAddressList = selector({
  key: "GlobalAddressList",
  get: ({ get }) => {
    const map = get(GlobalAddresses);
    return [...map.keys()];
  },
});

export const GlobalXENs = atom({
  key: "GlobalXENs",
  default: [],
});

export const MinDonate = atom({
  key: "MinDonate",
  default: "0",
});
