const { ethers } = require('hardhat')
const {
  BN, BN6, BN18,
  chaiSolidity,
  ZERO_ADDRESS,
  randomAddress
} = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()

const THREE_MILLION = BN(3).mul(BN6).mul(BN18)
const FOUR_MILLION = BN(4).mul(BN6).mul(BN18)
const FIVE_MILLION = BN(5).mul(BN6).mul(BN18)

describe('BrinkVote', function () {

  beforeEach(async function () {
    const signers = await ethers.getSigners()
    this.owner1 = signers[1]
    this.owner2 = signers[2]
    this.grantee1 = signers[3]
    this.grantee2 = signers[4]

    this.BrinkVote = await ethers.getContractFactory('BrinkVote')
  })

  describe('deploy', function () {
    beforeEach(async function () {
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
    })

    it('should have symbol BRINKVOTE', async function () {
      expect(await this.brinkVote.symbol()).to.equal('BRINKVOTE')
    })

    it('should have name "Brink Vote"', async function () {
      expect(await this.brinkVote.name()).to.equal('Brink Vote')
    })

    it('should have 18 decimals', async function () {
      expect(await this.brinkVote.decimals()).to.equal(18)
    })

    it('should have a cap of 5 million', async function () {
      expect(await this.brinkVote.cap()).to.equal(FIVE_MILLION)
    })

    it('should set initial owner', async function () {
      expect(await this.brinkVote.isOwner(this.owner1.address)).to.equal(true)
    })

    it('should set totalSupply to zero', async function () {
      expect(await this.brinkVote.totalSupply()).to.equal(0)
    })
  })

  describe('grant', function () {
    beforeEach(async function () {
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
      this.brinkVote_owner1 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner1)
    })

    describe('when granting to an address that does not have a balance', function () {
      beforeEach(async function () {
        this.amount1 = BN(2000).mul(BN18)
        this.amount2 = BN(3000).mul(BN18)
      })

      it('should increase balance for the address', async function () {
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount1)
        await this.brinkVote_owner1.grant(this.grantee2.address, this.amount2)
        expect(await this.brinkVote.balanceOf(this.grantee1.address)).to.equal(this.amount1)
        expect(await this.brinkVote.balanceOf(this.grantee2.address)).to.equal(this.amount2)
      })

      it('should increase totalSupply', async function () {
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount1)
        await this.brinkVote_owner1.grant(this.grantee2.address, this.amount2)
        expect(await this.brinkVote.totalSupply()).to.equal(this.amount1.add(this.amount2))
      })

      it('should emit a Transfer event', async function () {
        await expect(this.brinkVote_owner1.grant(this.grantee1.address, this.amount1))
          .to.emit(this.brinkVote_owner1, 'Transfer').withArgs(ZERO_ADDRESS, this.grantee1.address, this.amount1)
      })
    })

    describe('when granting multiple times to the same address', function () {
      beforeEach(async function () {
        this.amount1 = BN(2000).mul(BN18)
        this.amount2 = BN(3000).mul(BN18)
        this.total = this.amount1.add(this.amount2)
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount1)
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount2)
      })
      it('should add to the address balance', async function () {
        expect(await this.brinkVote.balanceOf(this.grantee1.address)).to.equal(this.total)
      })
      it('should increase totalSupply', async function () {
        expect(await this.brinkVote.totalSupply()).to.equal(this.total)
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        this.amount1 = BN(2000).mul(BN18)
        await expect(this.brinkVote.grant(this.grantee1.address, this.amount1)).to.be.revertedWith('NOT_OWNER')
      })
    })
  
    describe('when grant exceeds the totalSupply', function () {
      it('should revert with CAP_EXCEEDED', async function () {
        await this.brinkVote_owner1.grant(this.grantee1.address, FOUR_MILLION)
        await expect(this.brinkVote_owner1.grant(this.grantee2.address, THREE_MILLION)).to.be.revertedWith('CAP_EXCEEDED')
      })
    })
  })

  describe('addOwner', async function () {
    beforeEach(async function () {
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
      this.brinkVote_owner1 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner1)
    })

    describe('when adding new owner', function () {
      it('should add the owner', async function () {
        await this.brinkVote_owner1.addOwner(this.owner2.address)
        expect(await this.brinkVote.isOwner(this.owner2.address)).to.equal(true)
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        await expect(this.brinkVote.addOwner(this.owner2.address)).to.be.revertedWith('NOT_OWNER')
      })
    })
    
    describe('when adding existing owner', function () {
      it('should revert with ALREADY_OWNER', async function () {
        await this.brinkVote_owner1.addOwner(this.owner2.address)
        await expect(this.brinkVote_owner1.addOwner(this.owner2.address)).to.be.revertedWith('ALREADY_OWNER')
      })
    })
  })

  describe('removeOwner', function () {
    beforeEach(async function () {
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
      this.brinkVote_owner1 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner1)
      this.brinkVote_owner2 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner2)
      await this.brinkVote_owner1.addOwner(this.owner2.address)
    })

    describe('when removing existing owner', function () {
      it('should remove the owner', async function () {
        await this.brinkVote_owner1.removeOwner(this.owner2.address)
        expect(await this.brinkVote.isOwner(this.owner2.address)).to.equal(false)
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        await expect(this.brinkVote.removeOwner(this.owner2.address)).to.be.revertedWith('NOT_OWNER')
      })
    })

    describe('when removing address that is not an owner', function () {
      it('should revert with CANNOT_REMOVE_NON_OWNER', async function () {
        await expect(this.brinkVote_owner1.removeOwner(this.grantee1.address)).to.be.revertedWith('CANNOT_REMOVE_NON_OWNER')
      })
    })

    describe('when owner to remove is sender', function () {
      it('should revert with CANNOT_REMOVE_SELF_OWNER', async function () {
        await expect(this.brinkVote_owner1.removeOwner(this.owner1.address)).to.be.revertedWith('CANNOT_REMOVE_SELF_OWNER')
      })
    })
  })

  describe('multigrant', function () {
    beforeEach(async function () {
      this.amount = BN(2000).mul(BN18)
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
      this.brinkVote_owner1 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner1)
    })

    describe('when issuing valid grants', function () {
      it('should issue multiple grants', async function () {
        await this.brinkVote_owner1.multigrant(
          [this.grantee1.address, this.grantee2.address], this.amount
        )
        expect(await this.brinkVote.balanceOf(this.grantee1.address)).to.equal(this.amount)
        expect(await this.brinkVote.balanceOf(this.grantee2.address)).to.equal(this.amount)
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        await expect(this.brinkVote.multigrant(
          [this.grantee1.address, this.grantee2.address], this.amount
        )).to.be.revertedWith('NOT_OWNER')
      })
    })

    describe.skip('gas cost report', function () {
      it('log gas cost for multigrant', async function () {
        let accounts = []
        for (let i = 0; i < 100; i++) {
          accounts[i] = (await randomAddress()).address
        }
        const tx = await this.brinkVote_owner1.multigrant(accounts, this.amount)
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
        const gasUsed = receipt.gasUsed.toString()
        console.log('GAS USED: ', gasUsed)
      })
    })
  })
})
