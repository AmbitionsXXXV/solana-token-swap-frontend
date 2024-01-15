import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import * as token from '@solana/spl-token'
import { TOKEN_SWAP_PROGRAM_ID, TokenSwap } from '@solana/spl-token-swap'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import * as Web3 from '@solana/web3.js'
import { FC, useState } from 'react'
import {
  ScroogeCoinMint,
  kryptMint,
  poolKryptAccount,
  poolMint,
  poolScroogeAccount,
  swapAuthority,
  tokenSwapStateAccount,
} from '../utils/constants'

export const DepositSingleTokenType: FC = () => {
  const [poolTokenAmount, setAmount] = useState(0)

  // 获取钱包连接状态
  const { connection } = useConnection()
  // 获取钱包公钥
  const { publicKey, sendTransaction } = useWallet()

  const handleSubmit = (event: any) => {
    event.preventDefault()
    handleTransactionSubmit()
  }

  const handleTransactionSubmit = async () => {
    if (!publicKey) {
      alert('Please connect your wallet!')

      return
    }

    // poolMintInfo 保存我们已经获取的池代币的数据
    const poolMintInfo = await token.getMint(connection, poolMint)

    // 获取与 kryptMint 代币相关联的代币账户地址
    // 这个地址用于管理和存储 kryptMint 代币
    const kryptATA = await token.getAssociatedTokenAddress(kryptMint, publicKey)

    // 获取与 ScroogeCoinMint 代币相关联的代币账户地址
    // 这个地址用于管理和存储 ScroogeCoinMint 代币
    const scroogeATA = await token.getAssociatedTokenAddress(
      ScroogeCoinMint,
      publicKey,
    )

    // 获取与 poolMint 代币相关联的代币账户地址
    // 这个地址用于管理和存储流动性池中的 poolMint 代币
    const tokenAccountPool = await token.getAssociatedTokenAddress(
      poolMint,
      publicKey,
    )

    const transaction = new Web3.Transaction()

    // 检查并创建代币账户
    let account = await connection.getAccountInfo(tokenAccountPool)

    if (account == null) {
      const createATAInstruction = token.createAssociatedTokenAccountInstruction(
        publicKey,
        tokenAccountPool,
        publicKey,
        poolMint,
      )
      transaction.add(createATAInstruction)
    }

    // 构建用于同时向两边的交换池存入代币的指令
    const instruction = TokenSwap.depositAllTokenTypesInstruction(
      tokenSwapStateAccount, // token swap 状态账户
      swapAuthority, // 交换池的授权账户
      publicKey, // 用户的转账授权账户
      kryptATA, // 用户代币 A 账户，用于向交换池代币 A 账户转账
      scroogeATA, // 用户代币 B 账户，用于向交换池代币 B 账户转账
      poolKryptAccount, // 交换池代币 A 账户，接收用户的代币 A
      poolScroogeAccount, // 交换池代币 B 账户，接收用户的代币 B
      poolMint, // LP-token 的 mint 地址
      tokenAccountPool, // 用户的 LP-token 账户，交换池向此账户铸造 LP-token
      TOKEN_SWAP_PROGRAM_ID, // Token Swap 程序的地址
      token.TOKEN_PROGRAM_ID, // Token 程序的地址
      poolTokenAmount * 10 ** poolMintInfo.decimals, // 用户希望接收的 LP-token 数量
      100e9, // 存入代币 A 的最大数量，设置较大数值以减少交易失败的可能性
      100e9, // 存入代币 B 的最大数量，同上
    )

    transaction.add(instruction)

    try {
      let txid = await sendTransaction(transaction, connection)
      alert(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`,
      )
      console.log(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`,
      )
    } catch (e) {
      console.log(JSON.stringify(e))
      alert(JSON.stringify(e))
    }
  }

  return (
    <Box
      p={4}
      display={{ md: 'flex' }}
      maxWidth="32rem"
      margin={2}
      justifyContent="center"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '0px 10px 5px 7px' }}>
          <FormControl isRequired>
            <FormLabel color="gray.200">
              LP-Tokens to receive for deposit to Liquidity Pool
            </FormLabel>

            <NumberInput
              onChange={valueString => setAmount(parseInt(valueString))}
              style={{
                fontSize: 20,
              }}
              placeholder="0.00"
            >
              <NumberInputField id="amount" color="gray.400" />
            </NumberInput>

            <Button width="full" mt={4} type="submit">
              Deposit
            </Button>
          </FormControl>
        </div>
      </form>
    </Box>
  )
}
