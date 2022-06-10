const Mintable = artifacts.require("ERC721EnumerablePausable");

contract('ERC721EnumerablePausable_unit', (accounts) => {
  it('should return correct total supply', async () => {
    const mintable = await Mintable.new("name", "symbol", "/");

    let count = 0;
    for (let i = 1; i < accounts.length; i++) {
      const quantity = i*2;
      count += quantity;
      await mintable.mint(accounts[i], quantity);
    }

    const result = await mintable.totalSupply.call()
    assert.equal(result, count, 'total supply must match expected count')
  });

  it('should return token by index', async () => {
    const mintable = await Mintable.new("name", "symbol", "/");

    for (let i = 1; i < accounts.length; i++) {
      const quantity = i*2;
      await mintable.mint(accounts[i], quantity);
    }

    const result = await mintable.tokenByIndex.call(20)
    assert.equal(result, 21, 'index must be 1 less than token number')
  });

  it('should return token by index for owner', async () => {
    const mintable = await Mintable.new("name", "symbol", "/");
    const owner1 = accounts[1];
    const owner2 = accounts[2];
    const owner3 = accounts[3];

    await mintable.mint(owner1, 5); // 1, 2, 3, 4, 5
    await mintable.mint(owner2, 3); // 6, 7, 8
    await mintable.mint(owner1, 5); // 9, 10, 11, 12, 13
    await mintable.mint(owner3, 2); // 14, 15
    await mintable.mint(owner2, 1); // 16
    await mintable.mint(owner1, 2); // 17, 18
    await mintable.mint(owner3, 1); // 19

    const counts = {};
    counts[owner1] = [1,2,3,4,5,9,10,11,12,13,17,18];
    counts[owner2] = [6,7,8,16];
    counts[owner3] = [14,15,19];

    for (let key in counts) {
      let b = (await mintable.balanceOf.call(key)).toNumber();
      assert.equal(b, counts[key].length, 'balance must be total of owner -- 1');

      for (let i = 0; i < counts[key].length; i++) {
        let r = (await mintable.tokenOfOwnerByIndex.call(key, i)).toNumber();
        assert.equal(r, counts[key][i], 'id at owner index must match token id')
      }
    }
  });

  it("should minimize gas for multiple tokens minted", async () => {
    const mintable = await Mintable.new("name", "symbol", "/");
    const result = await mintable.mint.estimateGas(accounts[0], 1);
    const large = await mintable.mint.estimateGas(accounts[1], 10);
    const maxGas = 105000;
    const maxGasLarge = 740000;

    assert(result < maxGas, `gas should be minimal for minting. expected ${maxGas}; got ${result}`);
    assert(large < maxGasLarge, `gas should be minimal for minting large sums. expected ${maxGasLarge}; got ${large}`);
  });
});