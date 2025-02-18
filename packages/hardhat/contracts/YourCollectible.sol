// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol"; // 引入 ECDSA 库

contract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    Counters.Counter public tokenIdCounter; // 用于跟踪令牌 ID 的计数器
    mapping(uint256 => uint256) public tokenPrices; // 用于存储令牌价格的映射
    mapping(bytes32 => bool) private usedHashes; // 用于记录已经使用过的交易哈希
    mapping(uint256 => uint256) public nonces; // 用于记录每个NFT的 nonce 值
	mapping(uint256 => address) private _creators; // 存储每个tokenId的创作者地址
	uint256 public royaltyPercentage = 5; // 版税百分比，默认设置为5%
	mapping(uint256 => TransactionHistory[]) public tokenTransactionHistory; // 每个 tokenId 对应的交易历史记录

	//盲盒合约（6.sol）
	uint256 public mysteryBoxPrice = 0.1 ether; // 盲盒价格
	uint256[] public availableTokens; // 可供选择的NFT tokenId列表

  //NFT的忠诚度合约（13.sol）
	mapping(uint256 => uint256) public holdingStartTime; // 持有NFT的开始时间
	mapping(uint256 => bool) public loyaltyRewardClaimed; // 是否已领取忠诚度奖励
	uint256 public loyaltyPeriod = 30 days; // 忠诚度奖励的持有期

   //NFT的分红合约（14.sol）
	address[] public profitSharingAddresses; // 收益分享地址
	uint256[] public profitSharingPercentages; // 收益分享比例（以百分比表示，100为最大）

    event PurchaseNFT(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price, uint256 timestamp);

    constructor() ERC721("YourCollectible", "LYJ") {}

    // 铸造NFT
    function mintItem(address to, string memory uri) public returns (uint256) {
        tokenIdCounter.increment(); // 增加NFT ID
        uint256 tokenId = tokenIdCounter.current(); // 获取当前的NFT ID
        _safeMint(to, tokenId); // 安全地铸造NFT
        _setTokenURI(tokenId, uri); // 设置NFT URI
        return tokenId; // 返回NFT ID
    }

    // 覆������� _baseURI 函数，返回一个空字符串
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

  // 使用多重签名和时间戳购买NFT
    function buyNFTWithMultiSig(
        uint256 tokenId,
        uint256 price,
        uint256 timestamp,
        bytes memory signatureSeller
    ) public payable {
        require(tokenPrices[tokenId] == price, "Price does not match the listed price");
        require(block.timestamp <= timestamp + 10 minutes, "Transaction has expired");
        
        address seller = ownerOf(tokenId);
        bytes32 hash = keccak256(abi.encodePacked(tokenId, price, msg.sender, seller, timestamp));
        
        // 检查hash是否已被使用
        require(!usedHashes[hash], "Transaction already processed");
        
        // 验证卖家签名
        require(_verify(hash, signatureSeller, seller), "Invalid seller signature");
        
        require(msg.value == price, "Incorrect price sent");
        
        // 完成NFT转移
        _transfer(seller, msg.sender, tokenId);
        
        // 将交易资金发送给卖家
        payable(seller).transfer(msg.value);
        
        // 更新已使用的hash
        usedHashes[hash] = true;
        
        // 记录交易事件
        emit PurchaseNFT(tokenId, msg.sender, seller, price, block.timestamp);
    }
// 使用随机数（nonce）和多重签名购买NFT
    function buyNFTWithNonce(
        uint256 tokenId,
        uint256 price,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signatureSeller
    ) public payable {
        require(tokenPrices[tokenId] == price, "Price does not match the listed price");
        require(block.timestamp <= timestamp + 10 minutes, "Transaction has expired");
        
        address seller = ownerOf(tokenId);
        bytes32 hash = keccak256(abi.encodePacked(tokenId, price, msg.sender, seller, timestamp, nonce));

        // 检查hash是否已被使用
        require(!usedHashes[hash], "Transaction already processed");
        // 确保nonce匹配
        require(nonce == nonces[tokenId], "Nonce does not match");

        // 验证卖家签名
        require(_verify(hash, signatureSeller, seller), "Invalid seller signature");

        require(msg.value == price, "Incorrect price sent");

        // 完成NFT转移
        _transfer(seller, msg.sender, tokenId);

        // 将交易资金发送给卖家
        payable(seller).transfer(msg.value);

        // 更新nonce和hash
        nonces[tokenId]++; // 更新NFT的nonce
        usedHashes[hash] = true;

        // 记录交易事件
        emit PurchaseNFT(tokenId, msg.sender, seller, price, block.timestamp);
    }

    // 验证签名
    function _verify(bytes32 hash, bytes memory signature, address signer) internal pure returns (bool) {
        return hash.toEthSignedMessageHash().recover(signature) == signer;
    }
 // 覆盖 ERC721 标准的部分函数
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    // 购买方法（不使用nonce）
    function purchase(
        uint256 tokenId,
        address from,
        uint256 price
    ) public payable {
        require(_exists(tokenId), "Token does not exist"); // 确保令牌存在
        require(from == ownerOf(tokenId), "From address is not the owner"); // 确保 from 地址是令牌的所有者
        require(msg.value == price, "Incorrect price"); // 确保发送的以太币数量与价格相符

        // 将价格转移给卖家
        payable(from).transfer(price);

        // 转移令牌
        _transfer(from, msg.sender, tokenId);
    }

   //NFT的稀有度合约（11.sol）
	enum Rarity {
		Common,
		Rare,
		Epic,
		Legendary
	} //枚举类型 ，表示稀有度 普通 稀有 史诗 传奇
	mapping(uint256 => Rarity) public tokenRarities; // tokenId 对应的稀有度




//交易历史记录合约（2.sol）
	struct TransactionHistory {
		address seller;
		address buyer;
		uint256 price;
		uint256 timestamp;
	}
	//拍卖合约（3.sol）
		struct Auction {
		address seller;
		uint256 tokenId;
		uint256 minBid;
		uint256 highestBid;
		address highestBidder;
		uint256 endTime;
		bool active;
	}
	mapping(uint256 => Auction) public auctions; // 每个 tokenId 对应的拍卖信息


//租赁合约(4.sol)
	struct Rental {
		address renter;
		uint256 rentPrice;
		uint256 startTime;
		uint256 duration;
		bool active;
	}
	mapping(uint256 => Rental) public rentals; // 每个 tokenId 对应的租赁信息

//碎片化合约（5.sol）
	struct FractionalOwnership {
		uint256 totalShares;
		mapping(address => uint256) sharesOwned;
	}
	mapping(uint256 => FractionalOwnership) public fractionalOwnerships; // 每个 tokenId 对应的碎片化所有权




	 // 覆盖 buyNFT 函数，增加版税支付逻辑
	function buyNFT(uint256 tokenId) public payable {
		// 1. 状态检查
		uint256 price = tokenPrices[tokenId];
		require(price > 0, unicode"该NFT未在售");
		require(msg.value == price, unicode"支付金额不正确");
		require(tokenId <= tokenIdCounter.current(), unicode"NFT不存在");

		// 2. 获取相关地址
		address seller = ownerOf(tokenId);
		address creator = _creators[tokenId];
		require(seller != msg.sender, unicode"不能购买自己的NFT");
		require(seller != address(0), unicode"NFT所有者地址无效");

		// 3. 计算金额分配
		uint256 royaltyAmount = (msg.value * royaltyPercentage) / 100;
		uint256 sellerAmount = msg.value - royaltyAmount;

		// 4. 创建交易记录
		TransactionHistory memory txHistory = TransactionHistory({
			seller: seller,
			buyer: msg.sender,
			price: msg.value,
			timestamp: block.timestamp
		});

		// 5. 执行交易
		bool transferSuccess = false;
		bool paymentSuccess = false;

		try {
			// 5.1 转移 NFT
			_transfer(seller, msg.sender, tokenId);
			transferSuccess = true;

			// 5.2 支付版税
			(bool royaltySent,) = payable(creator).call{value: royaltyAmount}("");
			require(royaltySent, unicode"版税支付失败");

			// 5.3 支付卖家
			(bool sellerPaid,) = payable(seller).call{value: sellerAmount}("");
			require(sellerPaid, unicode"卖家支付失败");

			paymentSuccess = true;

			// 5.4 执行分红
			distributeProfits(msg.value);

			// 5.5 记录交易历史
			tokenTransactionHistory[tokenId].push(txHistory);

			// 5.6 重置价格
			tokenPrices[tokenId] = 0;

			// 5.7 触发购买成功事件
			emit PurchaseNFT(
				tokenId,
				msg.sender,
				seller,
				msg.value,
				block.timestamp
			);
		} catch Error(string memory reason) {
			// 处理已知错误
			revert(string(abi.encodePacked(unicode"交易失败: ", reason)));
		} catch {
			// 处理未知错误
			if (!transferSuccess) {
				revert(unicode"NFT转移失败");
			}
			if (!paymentSuccess) {
				revert(unicode"支付失败");
			}
			revert(unicode"交易执行失败");
		}
	}
		// 修改版税百分比
	function setRoyaltyPercentage(uint256 percentage) public onlyOwner {
		royaltyPercentage = percentage;
	}

	// 查询指定NFT的交易历史记录
	function getTokenTransactionHistory(
		uint256 tokenId
	) public view returns (TransactionHistory[] memory) {
		return tokenTransactionHistory[tokenId];
	}






	// 创建拍卖
	function createAuction(
		uint256 tokenId,
		uint256 minBid,
		uint256 duration
	) public {
		require(
			ownerOf(tokenId) == msg.sender,
			unicode"只有拥有者才能发起拍卖"
		);
		require(
			!auctions[tokenId].active,
			unicode"该版权已经在拍卖中"
		);

		auctions[tokenId] = Auction({
			seller: msg.sender,
			tokenId: tokenId,
			minBid: minBid,
			highestBid: 0,
			highestBidder: address(0),
			endTime: block.timestamp + duration,
			active: true
		});
	}

	// 出价
	function Bid(uint256 tokenId) public payable {
		Auction storage auction = auctions[tokenId];
		require(auction.active, unicode"该拍卖不活跃");
		require(block.timestamp < auction.endTime, unicode"拍卖已结束");
		require(
			msg.value > auction.highestBid,
			unicode"出价低于当前最高出价"
		);

		// 退还之前的最高出价��
		if (auction.highestBidder != address(0)) {
			payable(auction.highestBidder).transfer(auction.highestBid);
		}

		auction.highestBid = msg.value;
		auction.highestBidder = msg.sender;
	}
  // 开始拍卖
	function startAuction(
		uint256 tokenId,
		uint256 minBid,
		uint256 auctionDuration
	) public {
		require(
			ownerOf(tokenId) == msg.sender,
			unicode"只有NFT拥有者可以发起拍卖"
		);
		require(
			!auctions[tokenId].active,
			unicode"这场NFT拍卖已被激活"
		);

		auctions[tokenId] = Auction({
			seller: msg.sender,
			tokenId: tokenId,
			minBid: minBid,
			highestBid: 0,
			highestBidder: address(0),
			endTime: block.timestamp + auctionDuration,
			active: true
		});
	}
  // 结束拍卖并转移NFT
	function endAuction(uint256 tokenId) public {
		Auction storage auction = auctions[tokenId];
		require(auction.active, unicode"拍卖已结束");
		require(
			block.timestamp >= auction.endTime,
			unicode"拍卖尚未结束"
		);

		auction.active = false;
		if (auction.highestBidder != address(0)) {
			// 将NFT转移给最高出价者
			_transfer(ownerOf(tokenId), auction.highestBidder, tokenId);
			// 将拍卖款项转移给卖家
			payable(ownerOf(tokenId)).transfer(auction.highestBid);
		}
	}







	// 设置分红信息
	function setProfitSharing(
		address[] memory addresses,
		uint256[] memory percentages
	) public onlyOwner {
		require(addresses.length == percentages.length, unicode"地址和比例长度不匹配");
		uint256 totalPercentage = 0;
		for (uint256 i = 0; i < percentages.length; i++) {
			totalPercentage += percentages[i];
		}
		require(totalPercentage <= 100, unicode"分红比例总和不能超过100%");

		profitSharingAddresses = addresses;
		profitSharingPercentages = percentages;
	}

	// 分配利润
	function distributeProfits(uint256 amount) internal {
		for (uint256 i = 0; i < profitSharingAddresses.length; i++) {
			uint256 share = (amount * profitSharingPercentages[i]) / 100;
			payable(profitSharingAddresses[i]).transfer(share);
		}
	}






	



  // 创建租赁
	function createRental(
		uint256 tokenId,
		uint256 rentPrice,
		uint256 duration
	) public {
		require(ownerOf(tokenId) == msg.sender, unicode"只有NFT拥有者可以出租");
		require(!rentals[tokenId].active, unicode"该NFT已经出租");

		rentals[tokenId] = Rental({
			renter: address(0),
			rentPrice: rentPrice,
			startTime: 0,
			duration: duration,
			active: true
		});
	}
  // 租用NFT
	function rentNFT(uint256 tokenId) public payable {
		Rental storage rental = rentals[tokenId];
		require(rental.active, unicode"该NFT不可出租");
		require(msg.value == rental.rentPrice, unicode"支付的租金不正确");

		rental.renter = msg.sender;
		rental.startTime = block.timestamp;

		// 临时转移NFT的所有权给租用者
		_transfer(ownerOf(tokenId), msg.sender, tokenId);

		// 支付租金给NFT持有者
		payable(ownerOf(tokenId)).transfer(msg.value);
	}
  // 结束租赁并归还NFT
	function endRental(uint256 tokenId) public {
		Rental storage rental = rentals[tokenId];
		require(rental.active, unicode"该NFT未处于出租状态");
		require(
			block.timestamp >= rental.startTime + rental.duration,
			unicode"租赁期尚未结束"
		);
		require(rental.renter != address(0), unicode"该NFT未被租赁");

		// 归还NFT给所有者
		_transfer(rental.renter, ownerOf(tokenId), tokenId);

		// 重置租赁信息
		rental.renter = address(0);
		rental.startTime = 0;
		rental.active = false;
	}




	// 创建碎片化NFT
	function createFractionalNFT(uint256 tokenId, uint256 totalShares) public {
		require(
			ownerOf(tokenId) == msg.sender,
			unicode"只有NFT拥有者可以进行碎片化"
		);
		require(totalShares > 0, unicode"份额数必须大于0");

		fractionalOwnerships[tokenId].totalShares = totalShares;
		fractionalOwnerships[tokenId].sharesOwned[msg.sender] = totalShares;
	}
  // 转移NFT份额
	function transferShares(
		uint256 tokenId,
		address to,
		uint256 shares
	) public {
		require(
			fractionalOwnerships[tokenId].sharesOwned[msg.sender] >= shares,
			unicode"持有份额不足"
		);

		fractionalOwnerships[tokenId].sharesOwned[msg.sender] -= shares;
		fractionalOwnerships[tokenId].sharesOwned[to] += shares;
	}
  // 查询某地址的份额
	function getShares(
		uint256 tokenId,
		address owner
	) public view returns (uint256) {
		return fractionalOwnerships[tokenId].sharesOwned[owner];
	}
   // 获取NFT的总份额
	function getTotalShares(uint256 tokenId) public view returns (uint256) {
		return fractionalOwnerships[tokenId].totalShares;
	}






	// 设置盲盒价格
	function setMysteryBoxPrice(uint256 price) public onlyOwner {
		mysteryBoxPrice = price;
	}
   // 添加可供选择的NFT
	function addAvailableToken(uint256 tokenId) public onlyOwner {
		availableTokens.push(tokenId);
	}
   // 随机从盲盒中获取NFT
	function buyMysteryBox() public payable returns (uint256) {
		require(msg.value == mysteryBoxPrice, unicode"��付的价格不正确");
		require(availableTokens.length > 0, unicode"没有可用的NFT");
		// 随机选择一个NFT
		uint256 randomIndex = uint256(
			keccak256(abi.encodePacked(block.timestamp, msg.sender))
		) % availableTokens.length;
		uint256 tokenId = availableTokens[randomIndex];
		// 从可用列表中移除该NFT
		availableTokens[randomIndex] = availableTokens[
			availableTokens.length - 1
		];
		availableTokens.pop();
		// 将NFT转移给购买者
		_transfer(ownerOf(tokenId), msg.sender, tokenId);

		return tokenId;
	}









     //铸造和销毁NFT合约(7.sol，8.sol)
	// 批量铸造NFT
	function mintBatch(
		address to,
		string[] memory uris
	) public returns (uint256[] memory) {
		uint256[] memory tokenIds = new uint256[](uris.length);

		for (uint256 i = 0; i < uris.length; i++) {
			tokenIds[i] = mintItem(to, uris[i]);
		}

		return tokenIds;
	}

	// 销毁NFT
	function burnNFT(uint256 tokenId) public {
		require(
			ownerOf(tokenId) == msg.sender,
			"Only NFT holders can burn NFTs"
		);
		_burn(tokenId);
	}








    //转载NFT合约（10.sol）
	// 将NFT作为礼物赠送
	function giftNFT(address to, uint256 tokenId) public {
		require(
			ownerOf(tokenId) == msg.sender,
			unicode"只有NFT持有者可以转增NFT"
		);
		_transfer(msg.sender, to, tokenId);
	}








	// 设置NFT的稀有度
	function setTokenRarity(uint256 tokenId, Rarity rarity) public onlyOwner {
		tokenRarities[tokenId] = rarity;
	}

	// 获取NFT的稀有度
	function getTokenRarity(uint256 tokenId) public view returns (Rarity) {
		return tokenRarities[tokenId];
	}






//NFT的空投（12.sol)
	// 空投NFT给多个地址
	function airdropNFT(
		address[] memory recipients,
		string memory uri
	) public onlyOwner {
		for (uint256 i = 0; i < recipients.length; i++) {
			mintItem(recipients[i], uri);
		}
	}






	// 持有NFT时记录开始时间
	function _transfer(
		address from,
		address to,
		uint256 tokenId
	) internal override {
		super._transfer(from, to, tokenId);
		holdingStartTime[tokenId] = block.timestamp;
		loyaltyRewardClaimed[tokenId] = false; // 转移时重置忠诚奖励领取状态
	}

	// 领取忠诚度奖励
	function claimLoyaltyReward(uint256 tokenId) public {
		require(
			ownerOf(tokenId) == msg.sender,
			unicode"只有NFT所有者可以领取奖励"
		);
		require(
			!loyaltyRewardClaimed[tokenId],
			unicode"忠诚度奖励已经领取"
		);
		require(
			block.timestamp >= holdingStartTime[tokenId] + loyaltyPeriod,
			unicode"持有时间不足，不能领取奖励"
		);

		// 发送忠诚度奖励 (例如：ERC20 代币或其他奖励)
		// 奖励逻辑可以在此处实现

		loyaltyRewardClaimed[tokenId] = true; // 标记为已领取
	}

	// 设置忠诚度奖励持有期
	function setLoyaltyPeriod(uint256 newPeriod) public onlyOwner {
		loyaltyPeriod = newPeriod;
	}
}











