const mineflayer = require('mineflayer')
const {Vec3} = require('vec3')
const {pathfinder, Movements, goals} = require('mineflayer-pathfinder')

// 创建bot
const bot = mineflayer.createBot({
    host: 'cloud4.ender.cool', port: 25565, username: 'FarmerBot', version: '1.21.5'
})

// 加载路径寻找插件
bot.loadPlugin(pathfinder)
// 全局变量
let targetPlayer = null
let farmingAreas = new Map()
let isFollowing = false
let currentCrop = null
let isAutoMode = false
let autoModeTimer = null

// 作物类型映射 - 只保留小麦、胡萝卜、马铃薯、甜菜根
const cropTypes = {
    'wheat': 'wheat_seeds', 'carrot': 'carrot', 'potato': 'potato', 'beetroot': 'beetroot_seeds'
}

// 作物成熟状态映射
const cropMatureStates = {
    'wheat': 7, 'carrots': 7, 'potatoes': 7, 'beetroots': 3
}

// 指令处理
bot.on('chat', async (username, message) => {
    if (username === bot.username) return

    const player = bot.players[username]
    if (!player || !player.entity) return

    targetPlayer = player

    const args = message.split(' ')
    const command = args[0].toLowerCase()

    switch (command) {
        case 'follow':
            isFollowing = true
            bot.chat('开始跟随玩家')
            followPlayer()
            break

        case 'stop':
            isFollowing = false
            isAutoMode = false
            if (autoModeTimer) {
                clearTimeout(autoModeTimer)
                autoModeTimer = null
            }
            bot.chat('停止所有操作')
            break

        case 'plant':
            if (args.length < 2) {
                bot.chat('请指定要种植的作物类型')
                return
            }
            const cropType = args[1].toLowerCase()
            if (!cropTypes[cropType]) {
                bot.chat(`不支持的作物类型: ${cropType}`)
                bot.chat(`支持的作物: ${Object.keys(cropTypes).join(', ')}`)
                return
            }
            currentCrop = cropType
            isAutoMode = true
            bot.chat(`启动全自动模式，开始循环种植、收获、存储 ${cropType}`)
            await scanFarmingAreas()
            startAutoMode()
            break

        case 'harvest':
            bot.chat('开始收获作物')
            await scanFarmingAreas()
            await harvestCrops()
            break

        case 'store':
            bot.chat('开始存储物品到箱子')
            await storeItems()
            break

        case 'scan':
            bot.chat('扫描耕地区域...')
            await scanFarmingAreas()
            break

        case 'status':
            showStatus()
            break

        default:
            bot.chat('可用指令: follow, stop, plant <作物>, harvest, store, scan, status')
    }
})

// 跟随玩家
function followPlayer() {
    if (!isFollowing || !targetPlayer || !targetPlayer.entity) return

    const playerPos = targetPlayer.entity.position
    const botPos = bot.entity.position

    const distance = botPos.distanceTo(playerPos)

    if (distance > 3) {
        const targetPos = playerPos.offset(2, 0, 2)
        bot.pathfinder.goto(new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 2))
    }

    setTimeout(followPlayer, 1000)
}

// 扫描耕地区域
async function scanFarmingAreas() {
    farmingAreas.clear()

    const farmBlocks = bot.findBlocks({
        matching: (block) => {
            return block.name === 'farmland' && block.metadata >= 7
        }, maxDistance: 16, count: 1000
    })

    for (const pos of farmBlocks) {
        const cropPos = pos.offset(0, 1, 0)
        const cropBlock = bot.blockAt(cropPos)

        farmingAreas.set(pos.toString(), {
            soilPos: pos,
            cropPos: cropPos,
            hasCrop: cropBlock && cropBlock.name !== 'air',
            cropType: cropBlock ? cropBlock.name : null,
            isMature: isCropMature(cropBlock)
        })
    }

    bot.chat(`发现 ${farmingAreas.size} 块耕地`)

    const chestBlocks = bot.findBlocks({
        matching: (block) => {
            if (block.name !== 'chest' && block.name !== 'trapped_chest') return false;
            if (block.position === null) return false;
            return block.position.y > bot.player.entity.position.y;
        }, maxDistance: 10, count: 10, useExtraInfo: true
    })

    bot.chat(`发现 ${chestBlocks.length} 个箱子`)
}

// 检查作物是否成熟
function isCropMature(block) {
    if (!block || block.name === 'air') return false

    const matureState = cropMatureStates[block.name]
    if (matureState === undefined) return false

    return block.metadata >= matureState
}

// 种植作物
// 种植作物
async function plantCrops() {
    if (!currentCrop) {
        bot.chat('请先指定要种植的作物类型')
        return false
    }

    const seedItem = cropTypes[currentCrop]




    let plantedCount = 0

    for (const [posKey, area] of farmingAreas) {
        if (area.hasCrop) continue

        const soilBlock = bot.blockAt(area.soilPos)
        const cropBlock = bot.blockAt(area.cropPos)

        if (soilBlock.name !== 'farmland' || soilBlock.metadata < 7) continue
        if (cropBlock.name !== 'air') continue

        // try {
        await bot.pathfinder.goto(new goals.GoalXZ(area.soilPos.x, area.soilPos.z))

        const distance = bot.entity.position.distanceTo(area.soilPos)
        if (distance > 5) continue

        // 切换到种子物品
        try {
            const seeds = bot.inventory.items().find(item => item.name === seedItem)
            if (!seeds) {
                bot.chat(`背包中没有 ${seedItem}，请补充种子`)
                return false
            }
            await bot.equip(seeds, 'hand')
            // bot.chat(`已切换到 ${seedItem}`)
        } catch (equipError) {
            bot.chat(`切换到 ${seedItem} 失败: ${equipError.message}`)
            return false
        }
        await bot.placeBlock(soilBlock, new Vec3(0, 1, 0))
        plantedCount++

        area.hasCrop = true
        area.cropType = currentCrop

        const remainingSeeds = bot.inventory.items().find(item => item.name === seedItem)
        if (!remainingSeeds || remainingSeeds.count <= 0) {
            bot.chat('种子不足，停止种植')
            break
        }

        await new Promise(resolve => setTimeout(resolve, 200))

        // } catch (error) {
        //     console.log(`种植失败: ${error.message}`)
        // }
    }

    bot.chat(`成功种植 ${plantedCount} 株 ${currentCrop}`)
    return plantedCount > 0
}


// 收获作物
async function harvestCrops() {
    let harvestedCount = 0

    for (const [posKey, area] of farmingAreas) {
        if (!area.hasCrop) continue

        const cropBlock = bot.blockAt(area.cropPos)
        if (!cropBlock || cropBlock.name === 'air') {
            area.hasCrop = false
            continue
        }

        if (!isCropMature(cropBlock)) continue

        try {
            await bot.pathfinder.goto(new goals.GoalXZ(area.cropPos.x, area.cropPos.z))
            await bot.dig(cropBlock, true)
            harvestedCount++

            area.hasCrop = false
            area.cropType = null
            area.isMature = false

            await new Promise(resolve => setTimeout(resolve, 200))

        } catch (error) {
            console.log(`收获失败: ${error.message}`)
        }
    }

    if (harvestedCount > 0) {
        bot.chat(`成功收获 ${harvestedCount} 株作物`)
        // 收获后自动存储到箱子
        await storeItems()
    }

    return harvestedCount > 0
}

// 存储物品到箱子 - 修改为保留至少两组种子
// 存储物品到箱子 - 修改为保留至少两组种子
async function storeItems() {
    const chestBlocks = bot.findBlocks({
        matching: (block) => {
            if (block.name !== 'chest' && block.name !== 'trapped_chest') return false;
            if (block.position === null) return false;
            return block.position.y > bot.player.entity.position.y;
        }, maxDistance: 10, count: 10, useExtraInfo: true
    })

    if (chestBlocks.length === 0) {
        bot.chat('附近没有找到箱子')
        return false
    }

    const sortedChests = chestBlocks.sort((a, b) => {
        const distA = bot.entity.position.distanceTo(new Vec3(a.x, a.y, a.z))
        const distB = bot.entity.position.distanceTo(new Vec3(b.x, b.y, b.z))
        return distA - distB
    })

    let storedCount = 0

    for (const chestPos of sortedChests) {
        const chestBlock = bot.blockAt(chestPos)
        if (!chestBlock) continue

        try {
            await bot.pathfinder.goto(new goals.GoalXZ(chestPos.x, chestPos.z))
            const chest = await bot.openContainer(chestBlock)

            // 获取背包中的所有物品
            const inventoryItems = bot.inventory.items()

            for (const item of inventoryItems) {
                try {
                    // 计算需要保留的数量
                    let keepCount = 0

                    // 如果是种子，保留至少2组（通常是128个）
                    const seedItems = Object.values(cropTypes)
                    if (seedItems.includes(item.name)) {
                        keepCount = 128 // 保留2组种子（每组64个）
                    }

                    // 计算可以存储的数量
                    const storeCount = Math.max(0, item.count - keepCount)

                    // 检查是否是需要存储的作物相关物品
                    const validItems = [...Object.values(cropTypes), // 种子
                        'wheat', 'carrot', 'potato', 'beetroot' // 成熟作物
                    ]

                    if (validItems.includes(item.name)) {
                        if (storeCount > 0) {
                            try {
                                await chest.deposit(item.type, null, storeCount)
                                storedCount += storeCount
                                console.log(`存储 ${storeCount} 个 ${item.name} (保留 ${keepCount} 个)`)
                            } catch (depositError) {
                                console.log(`存储 ${item.name} 失败: ${depositError.message}`)
                            }
                        } else {
                            console.log(`保留 ${item.name}: ${item.count} 个 (无需存储)`)
                        }
                    }
                } catch (itemError) {
                    console.log(`处理物品 ${item.name} 失败:`, itemError.message)
                }
            }

            chest.close()

        } catch (error) {
            console.log(`打开箱子失败: ${error.message}`)
        }

        // 处理完一个箱子后短暂等待
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (storedCount > 0) {
        bot.chat(`成功存储 ${storedCount} 个物品到箱子`)
    } else {
        bot.chat('没有需要存储的物品或存储完成')
    }

    return storedCount > 0
}


// 显示状态信息
function showStatus() {
    const cropCount = Array.from(farmingAreas.values()).filter(area => area.hasCrop).length
    const matureCount = Array.from(farmingAreas.values()).filter(area => area.isMature).length

    bot.chat(`=== 农场状态 ===`)
    bot.chat(`耕地区域: ${farmingAreas.size} 块`)
    bot.chat(`已种植作物: ${cropCount} 株`)
    bot.chat(`成熟作物: ${matureCount} 株`)
    bot.chat(`当前作物: ${currentCrop || '未指定'}`)
    bot.chat(`跟随状态: ${isFollowing ? '开启' : '关闭'}`)
    bot.chat(`自动模式: ${isAutoMode ? '运行中' : '已停止'}`)

    // 显示背包中种子的数量
    if (currentCrop) {
        const seedItem = cropTypes[currentCrop]
        const seeds = bot.inventory.items().find(item => item.name === seedItem)
        const seedCount = seeds ? seeds.count : 0
        bot.chat(`背包中 ${seedItem}: ${seedCount} 个`)
    }
}

// 全自动模式主循环
async function startAutoMode() {
    if (!isAutoMode || !currentCrop) {
        return
    }

    // try {
    // 重新扫描区域
    await scanFarmingAreas()

    // 1. 先收获成熟的作物
    const matureCrops = Array.from(farmingAreas.values()).filter(area => area.isMature)
    if (matureCrops.length > 0) {
        bot.chat(`发现 ${matureCrops.length} 株成熟作物`)
        await harvestCrops()
    }

    // 2. 然后种植空地
    const emptyAreas = Array.from(farmingAreas.values()).filter(area => !area.hasCrop)
    if (emptyAreas.length > 0) {
        const success = await plantCrops()
        if (!success) {
            bot.chat('种子不足，等待补充...')
        }
    }

    // } catch (error) {
    //     console.log('自动模式出错:', error.message)
    //     bot.chat(`自动模式出错: ${error.message}`)
    // }

    // 15秒后继续循环（给更多时间处理存储）
    if (isAutoMode) {
        autoModeTimer = setTimeout(startAutoMode, 5000)
    }
}

// Bot准备就绪
bot.on('spawn', () => {
    console.log('种地bot已连接到服务器')
    bot.chat('种地bot已上线！支持作物: wheat, carrot, potato, beetroot')

    // 设置路径寻找移动方式
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = false;
    defaultMove.allow1by1towers = false;
    bot.pathfinder.setMovements(defaultMove)
})

// 错误处理
bot.on('kicked', (reason, loggedIn) => {
    console.log('被踢出服务器:', reason)
    isAutoMode = false
    if (autoModeTimer) {
        clearTimeout(autoModeTimer)
        autoModeTimer = null
    }
})

bot.on('error', (err) => {
    console.log('连接错误:', err)
    isAutoMode = false
    if (autoModeTimer) {
        clearTimeout(autoModeTimer)
        autoModeTimer = null
    }
})

bot.on('end', () => {
    console.log('Bot连接已断开')
    isAutoMode = false
    if (autoModeTimer) {
        clearTimeout(autoModeTimer)
        autoModeTimer = null
    }
})
