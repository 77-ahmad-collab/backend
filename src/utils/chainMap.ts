require('dotenv').config();

export const chainMap = {
  4: {
    token: process.env.TOKEN_ERC20,
    bridge: process.env.BRIDGE_ERC20,
    rpcName: 'PROVIDER_ERC20',
  },

  97: {
    token: process.env.TOKEN_BEP20,
    bridge: process.env.BRIDGE_BEP20,
    rpcName: 'PROVIDER_BEP20',
  },
};
