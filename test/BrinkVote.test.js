const { ethers } = require('hardhat')
const {
  BN, BN6, BN18,
  chaiSolidity
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

    it('should have symbol BVOTE', async function () {
      expect(await this.brinkVote.symbol()).to.equal('BVOTE')
    })

    it('should have name "Brink Vote"', async function () {
      expect(await this.brinkVote.name()).to.equal('Brink Vote')
    })

    it('should have 18 decimals', async function () {
      expect(await this.brinkVote.decimals()).to.equal(18)
    })

    it('should have total supply of 5 million', async function () {
      expect(await this.brinkVote.totalSupply()).to.equal(FIVE_MILLION)
    })

    it('should set initial owner', async function () {
      expect(await this.brinkVote.isOwner(this.owner1.address)).to.equal(true)
    })

    it('should set totalGranted to zero', async function () {
      expect(await this.brinkVote.totalGranted()).to.equal(0)
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
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount1)
        await this.brinkVote_owner1.grant(this.grantee2.address, this.amount2)
      })

      it('should increase balance for the address', async function () {
        expect(await this.brinkVote.balanceOf(this.grantee1.address)).to.equal(this.amount1)
        expect(await this.brinkVote.balanceOf(this.grantee2.address)).to.equal(this.amount2)
      })

      it('should increase totalGranted', async function () {
        expect(await this.brinkVote.totalGranted()).to.equal(this.amount1.add(this.amount2))
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        this.amount1 = BN(2000).mul(BN18)
        await expect(this.brinkVote.grant(this.grantee1.address, this.amount1)).to.be.revertedWith('NOT_OWNER')
      })
    })

    describe('when granting to an address that already has a balance', function () {
      it('should revert with ACCOUNT_HAS_BALANCE', async function () {
        this.amount = BN(2000).mul(BN18)
        await this.brinkVote_owner1.grant(this.grantee1.address, this.amount)
        await expect(this.brinkVote_owner1.grant(this.grantee1.address, this.amount)).to.be.revertedWith('ACCOUNT_HAS_BALANCE')
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
      this.amount1 = BN(2000).mul(BN18)
      this.amount2 = BN(3000).mul(BN18)
      this.brinkVote = await this.BrinkVote.deploy(this.owner1.address)
      this.brinkVote_owner1 = await this.BrinkVote.attach(this.brinkVote.address).connect(this.owner1)
    })

    describe('when issuing valid grants', function () {
      it('should issue multiple grants', async function () {
        await this.brinkVote_owner1.multigrant(
          [this.grantee1.address, this.grantee2.address], [this.amount1, this.amount2]
        )
        expect(await this.brinkVote.balanceOf(this.grantee1.address)).to.equal(this.amount1)
        expect(await this.brinkVote.balanceOf(this.grantee2.address)).to.equal(this.amount2)
      })
    })

    describe('when called by a non-owner', function () {
      it('should revert with NOT_OWNER', async function () {
        await expect(this.brinkVote.multigrant(
          [this.grantee1.address, this.grantee2.address], [this.amount1, this.amount2]
        )).to.be.revertedWith('NOT_OWNER')
      })
    })

    describe('when account and amount array lengths are not equal', function () {
      it('should revert with LENGTH_MISMATCH', async function () {
        await expect(this.brinkVote_owner1.multigrant(
          [this.grantee1.address], [this.amount1, this.amount2]
        )).to.be.revertedWith('LENGTH_MISMATCH')
      })
    })
  })
})
