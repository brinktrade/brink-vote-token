require('dotenv').config()

const GAS_PRICE = 10 * 10**9

async function main() {
  let opts = {}
  if (GAS_PRICE) opts.gasPrice = GAS_PRICE

  const BrinkVote = await ethers.getContractFactory('BrinkVote')

  const initialOwner = process.env.INITIAL_OWNER
  console.log(`deploying BrinkVote with owner ${initialOwner} gasPrice: ${GAS_PRICE || 'default'}...`)

  const brinkVote = await BrinkVote.deploy(initialOwner, opts)
  console.log(`deployed to address ${brinkVote.address}`)

  console.log()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })