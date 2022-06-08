const truffleAssert = require('truffle-assertions');
const GoatTokens = artifacts.require("ERC721EnumerablePausable");

contract('ERC721EnumerablePausable_integration', (accounts) => {

  it('should approve for proxy sender', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const owner = accounts[1];
    const proxy = accounts[2];
    const notowner = accounts[3];

    await tokensInstance.mint(owner, 3);
    await tokensInstance.approve(proxy, 2, { from: owner });

    let approval = await tokensInstance.getApproved.call(3);
    assert(approval == '0x0000000000000000000000000000000000000000', 'must equal the zero address');

    approval = await tokensInstance.getApproved.call(2);
    assert(approval == proxy, 'must equal the proxy sender address');

    try {
      await tokensInstance.approve(proxy, 2, { from: notowner });
      assert(false);
    } catch (error) {
      assert(error.message.indexOf('not owner'), 'error message must include not owner');
    }
  });

  it('should set approval for all', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const owner = accounts[1];
    const forall = accounts[2];
    const notapproved = accounts[3];

    await tokensInstance.mint(owner, 3);
    await tokensInstance.setApprovalForAll(forall, true, { from: owner });

    let approved = await tokensInstance.isApprovedForAll.call(owner, forall);
    assert(approved);

    approved = await tokensInstance.isApprovedForAll.call(owner, notapproved);
    assert(!approved);

    await tokensInstance.approve(notapproved, 2, { from: forall });

    const approval = await tokensInstance.getApproved.call(2);
    assert(approval == notapproved, 'must equal the newly approved by proxy sender address');

    await tokensInstance.setApprovalForAll(forall, false, { from: owner });
    approved = await tokensInstance.isApprovedForAll.call(owner, forall);
    assert(!approved);
  });

  it('should transfer via owner or approved', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const owner = accounts[1];
    const approved = accounts[2];
    const forall = accounts[3];
    const notapproved = accounts[4];
    const recipient = accounts[5];

    await tokensInstance.mint(owner, 10);
    await tokensInstance.setApprovalForAll(forall, true, { from: owner });
    await tokensInstance.approve(approved, 3, { from: owner });

    await tokensInstance.transferFrom(owner, recipient, 1, { from: owner });
    await tokensInstance.transferFrom(owner, recipient, 2, { from: forall });
    await tokensInstance.transferFrom(owner, recipient, 3, { from: approved });

    try {
      await tokensInstance.transferFrom(owner, recipient, 4, { from: approved });
      assert(false);
    } catch(e) {
      assert(true);
    }

    try {
      await tokensInstance.transferFrom(owner, recipient, 5, { from: notapproved });
      assert(false);
    } catch(e) {
      assert(true);
    }

    let addr = await tokensInstance.ownerOf.call(1);
    assert(addr == recipient, 'must equal the recipient address');

    addr = await tokensInstance.ownerOf.call(2);
    assert(addr == recipient, 'must equal the recipient address');

    addr = await tokensInstance.ownerOf.call(3);
    assert(addr == recipient, 'must equal the recipient address');

    addr = await tokensInstance.ownerOf.call(4);
    assert(addr == owner, 'must equal the owner address');
  });

  it('should return name and symbol', async () => {
    const name = "name";
    const symbol = "symbol";
    const tokensInstance = await GoatTokens.new(name, symbol, "/");

    const returnedName = (await tokensInstance.name.call()).toString();
    assert.equal(returnedName, name, 'returned name must match constructed name')

    const returnedSymbol = (await tokensInstance.symbol.call()).toString();
    assert.equal(returnedSymbol, symbol, 'returned name must match constructed symbol')
  });

  it('should mint tokens to correct owners', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const count = accounts.length
    for (let i = 1; i < count; i++) {
      await tokensInstance.mint(accounts[i], 10)
    }

    for (let i = 1; i < count; i++) {
      const base = 10*(i-1)

      for (let j = 1; j <= 10; j++) {
        const acc = (await tokensInstance.ownerOf.call(base+j)).toString();
        assert.equal(acc, accounts[i], 'owner account should match')
      }
    }
  });

  it('should return correct balance', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const count = accounts.length
    for (let i = 1; i < count; i++) {
      await tokensInstance.mint(accounts[i], i*2)
    }

    for (let i = 1; i < count; i++) {
      const amount = (await tokensInstance.balanceOf.call(accounts[i])).toNumber();
      assert.equal(amount, i*2, 'each account must have correct amount')
    }
  });

  it('should return correct uri on multiple mint', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const quantity = 20;

    await tokensInstance.mint(accounts[0], quantity)

    for (let i = 1; i <= quantity; i++) {
      const uri = (await tokensInstance.tokenURI.call(i)).toString();
      assert.equal(uri, `/${i}`, 'uri should match for each mint')
    }
  });

  it('should restrict minting to the minter role', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const minter = accounts[1]
    const receiver = accounts[2]
    const notminter = accounts[3]

    await tokensInstance.grantRole(await tokensInstance.MINTER_ROLE(), minter);

    try {
      await tokensInstance.mint(receiver, 1, { from: minter });
      assert(true, 'account with minter role allowed to mint')
    } catch(error) {
      assert(false, 'error should not be encountered from account with minter role')
    }

    try {
      await tokensInstance.mint(receiver, 1, { from: notminter });
      assert(false)
    } catch(error) {
      assert(error.message.indexOf('minter role') >= 0, 'error message must contain minter role');
    }
  });

  it('should update base uri', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "base/");

    for (let i = 1; i < accounts.length; i++) {
      await tokensInstance.mint(accounts[i], 1)
    }

    for (let i = 1; i < accounts.length; i++) {
      const uri = (await tokensInstance.tokenURI.call(i)).toString();
      assert.equal(uri, `base/${i}`, 'uri should match for each mint')
    }

    await tokensInstance.setBaseURI('new/');

    for (let i = 1; i < accounts.length; i++) {
      const uri = (await tokensInstance.tokenURI.call(i)).toString();
      assert.equal(uri, `new/${i}`, 'uri should match for each mint')
    }
  });

  it('should update token uri', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "base|");

    const letters = 'abcdefghijklmnopqrstuvwxyz'
    for (let i = 1; i < accounts.length; i++) {
      await tokensInstance.mint(accounts[i], 1)
    }

    await tokensInstance.setTokenURI(4, 'moon');

    for (let i = 1; i < accounts.length; i++) {
      let path = `base|${i}`;
      if (i == 4) {
        path = "base|moon"
      }
      const uri = (await tokensInstance.tokenURI.call(i)).toString();
      assert.equal(uri, path, 'uri should match for each mint')
    }
  });

  it('should transfer tokens to correct owners', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "base");
    const limit = accounts.length;
    for (let i = 1; i < limit; i++) {
      await tokensInstance.mint(accounts[i], 1)
    }

    for (let i = 1; i < limit; i++) {
      const from = accounts[i];
      const to = accounts[accounts.length - i];
      if (from == to) {
        continue;
      }

      await tokensInstance.safeTransferFrom(from, to, i, { from: from })
    }

    for (let i = 1; i < limit; i++) {
      const from = accounts[i];
      const to = accounts[accounts.length - i];
      if (from == to) {
        continue;
      }
      
      const acc = (await tokensInstance.ownerOf.call(i)).toString();
      assert.equal(acc, to, 'owner account should match')
    }
  });

  it('should burn tokens', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "base");
    const limit = accounts.length;

    for (let i = 1; i < limit; i++) {
      await tokensInstance.mint(accounts[i], 1)
    }

    for (let i = 1; i < limit; i++) {
      await tokensInstance.burn(i, { from: accounts[i] })
    }

    for (let i = 1; i < limit; i++) {
      try {
        await tokensInstance.ownerOf.call(i);
        assert(false, 'owner query should throw error')
      } catch(error) {
        assert(error.message.indexOf('nonexistent') >= 0, 'message should contain nonexistent')
      }
    }
  });

  it('should restrict burning to the owner or approved', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "base");

    const owner = accounts[1];
    const notowner = accounts[2];

    await tokensInstance.mint(owner, 2);

    await tokensInstance.burn(1, { from: owner });

    try {
      await tokensInstance.burn(2, { from: notowner });
      assert(false, 'should throw error')
    } catch(error) {
      assert(error.message.indexOf('not owner nor approved') >= 0, 'error message should include not owner nor approved')
    }

    await tokensInstance.approve(notowner, 2, { from: owner });
    await tokensInstance.burn(2, { from: notowner });
  });

  it('should stop minting when paused', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const success = accounts[1];
    const failure = accounts[2];

    await tokensInstance.mint(success, 1)
    await tokensInstance.pause();

    try {
      await tokensInstance.mint(failure, 1)
      assert(false, 'mint should throw error')
    } catch(error) {
      assert(error.message.indexOf('while paused') >= 0, 'error message must contain while paused');
    }

    await tokensInstance.unpause();
    await tokensInstance.mint(success, 1)
  });

  it('should not allow non-admin to grant or revoke roles', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    try {
      await tokensInstance.grantRole(await tokensInstance.MINTER_ROLE(), accounts[1], { from: accounts[2] });
      await tokensInstance.revokeRole(await tokensInstance.MINTER_ROLE(), accounts[1], { from: accounts[2] });
      assert(false, 'grant minter is an admin function');
    } catch(error) {
      assert(error.message.indexOf('missing role') >= 0, 'error message must contain missing role');
    }
  })

  it('should stop burning when paused', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const success = accounts[1];

    await tokensInstance.mint(success, 10)
    await tokensInstance.pause();

    try {
      await tokensInstance.burn(4, { from: success })
      assert(false, 'burn should throw error')
    } catch(error) {
      assert(error.message.indexOf('burned while contract is paused') >= 0, 'error message must contain burned while contract is paused');
    }

    await tokensInstance.unpause();
    await tokensInstance.burn(4, { from: success })
  });

  it('should stop transfers when paused', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const owner = accounts[1];
    const newOwner = accounts[2];

    await tokensInstance.mint(owner, 6)
    await tokensInstance.pause();

    try {
      await tokensInstance.safeTransferFrom(owner, newOwner, 3, { from: owner })
      assert(false, 'transfer should throw error')
    } catch(error) {
      assert(error.message.indexOf('transfer while paused') >= 0, 'error message must contain transfer while paused');
    }

    await tokensInstance.unpause();
    await tokensInstance.safeTransferFrom(owner, newOwner, 3, { from: owner })
  });

  it('should restrict pausing to pauser role', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");
    const pauser = accounts[1]
    const notpauser = accounts[2]

    await tokensInstance.grantRole(await tokensInstance.PAUSER_ROLE(), pauser)

    try {
      await tokensInstance.pause({ from: pauser });
      assert(true, 'account with pauser role allowed to pause')
    } catch(error) {
      assert(false, 'error should not be encountered from account with pauser role')
    }

    try {
      await tokensInstance.unpause({ from: pauser });
      assert(true, 'account with pauser role allowed to unpause')
    } catch(error) {
      assert(false, 'error should not be encountered from account with pauser role')
    }

    try {
      await tokensInstance.pause({ from: notpauser });
      assert(false)
    } catch(error) {
      assert(error.message.indexOf('pauser role') >= 0, 'error message must contain pauser role');
    }

    try {
      await tokensInstance.unpause({ from: notpauser });
      assert(false)
    } catch(error) {
      assert(error.message.indexOf('pauser role') >= 0, 'error message must contain pauser role');
    }
  });

  it('should emit stake event when staked', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const holder = accounts[1];
    await tokensInstance.mint(holder, 2);
    
    const result = await tokensInstance.stake(1);
    truffleAssert.eventEmitted(result, 'Stake', (ev) => {
      return ev.tokenId == 1 && !ev.available;
    });
  });

  it('should emit stake event when unstaked', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const holder = accounts[1];
    await tokensInstance.mint(holder, 2);
    
    await tokensInstance.stake(1);
    const result = await tokensInstance.unstake(1);
    truffleAssert.eventEmitted(result, 'Stake', (ev) => {
      return ev.tokenId == 1 && ev.available;
    });
  });

  it('should restrict staking to minter role', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const holder = accounts[1];
    const staker = accounts[2];
    await tokensInstance.mint(holder, 5);
  
    try {
      await tokensInstance.stake(3, { from: staker });
      assert(false, 'should throw an error')
    } catch(error) {
      assert(error.message.indexOf('minter role') >= 0, 'error message must contain minter role');
    }

    await tokensInstance.grantRole(await tokensInstance.MINTER_ROLE(), staker)
    await tokensInstance.stake(3, { from: staker });
  });

  it('should stop burning when staked', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const holder = accounts[1];
    await tokensInstance.mint(holder, 20);

    const owner = (await tokensInstance.ownerOf.call(13)).toString();
    assert.equal(owner, holder, 'owner of random id should be holder');

    const balance = (await tokensInstance.balanceOf.call(holder)).toNumber();
    assert.equal(balance, 20, 'must have balance of 20');
 
    await tokensInstance.stake(13);

    try {
      await tokensInstance.burn(13, { from: holder });
      assert(false, 'should throw an error')
    } catch(error) {
      assert(error.message.indexOf('must not be staked') >= 0, 'error message should contain must not be staked')
    }

    await tokensInstance.unstake(13);
    await tokensInstance.burn(13, { from: holder });
  });

  it('should stop transfers when staked', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const holder = accounts[1];
    await tokensInstance.mint(holder, 1);
  
    await tokensInstance.stake(1);

    try {
      await tokensInstance.safeTransferFrom(holder, accounts[2], 1, { from: holder });
      assert(false, 'should throw an error')
    } catch(error) {
      assert(error.message.indexOf('must not be staked') >= 0, 'error message should contain must not be staked')
    }

    await tokensInstance.unstake(1);
    await tokensInstance.safeTransferFrom(holder, accounts[2], 1, { from: holder });
  });

  it('should transfer ownership and remove roles from previous owner', async () => {
    const tokensInstance = await GoatTokens.new("name", "symbol", "/");

    const owner = accounts[0];
    const newOwner = accounts[1];
    const receiver = accounts[3];

    await tokensInstance.transferOwnership(newOwner);

    try {
      await tokensInstance.mint(receiver, 1, { from: owner });
      assert(false)
    } catch(error) {
      assert(error.message.indexOf('minter role') >= 0, 'old owner should not be allowed to mint')
    }

    await tokensInstance.mint(receiver, 1, { from: newOwner });
  });
});
