import {TileManager} from "db://assets/Script/Tile/TileManager";
import {ENTITY_STATE_ENUM, ROUND_TILE_INFO} from "db://assets/Enums";
import DataManager from "db://assets/Runtime/DataManager";

type IRoundTile = {
    [key in keyof typeof ROUND_TILE_INFO]?: TileManager
}

/**
 * 检测玩家身边8块地板内容
 * @param x 玩家x坐标
 * @param y 玩家y坐标
 * @param tileInfo 瓦片信息
 * @param expectTileType 希望输出的内容
 * @constructor
 */
export function ExaminePathPlayer (x: number, y: number, tileInfo: TileManager[][]) {
    const { mapRowCount, mapColumnCount } = DataManager.Instance
    // 玩家向上
    const playerTopNextY = y - 1 < 0 ? 0 : y - 1
    // 玩家向下
    const playerBottomNextY = y + 1 > mapColumnCount - 1 ? mapColumnCount : y + 1
    // 玩家向右
    const playerRightNextX = x + 1 > mapRowCount - 1 ? mapRowCount : x + 1
    // 玩家向左
    const playerLeftNextX = x - 1 < 0 ? 0 : x - 1

    let roundTileInfo: IRoundTile = {}

    Object.keys(ROUND_TILE_INFO).forEach(key => {
        if (!isNaN(Number(key))) {
            return
        }

        let examineTile: TileManager | {x: number, y: number}

        switch (key) {
            case ROUND_TILE_INFO.LEFT_TOP:
                examineTile = {
                    x: playerLeftNextX,
                    y: playerTopNextY,
                    ...tileInfo && tileInfo[playerLeftNextX][playerTopNextY]
                }
                break
            case ROUND_TILE_INFO.TOP:
                examineTile = {
                    x,
                    y: playerTopNextY,
                    ...tileInfo && tileInfo[x][playerTopNextY]
                }
                break
            case ROUND_TILE_INFO.RIGHT_TOP:
                examineTile = {
                    x: playerRightNextX,
                    y: playerTopNextY,
                    ...tileInfo && tileInfo[playerRightNextX][playerTopNextY]
                }
                break
            case ROUND_TILE_INFO.LEFT:
                examineTile = {
                    x: playerLeftNextX,
                    y,
                    ...tileInfo && tileInfo[playerLeftNextX][y]
                }
                break
            case ROUND_TILE_INFO.RIGHT:
                examineTile = {
                    x: playerRightNextX,
                    y,
                    ...tileInfo && tileInfo[playerRightNextX][y]
                }
                break
            case ROUND_TILE_INFO.LEFT_BOTTOM:
                examineTile = {
                    x: playerLeftNextX,
                    y: playerBottomNextY,
                    ...tileInfo && tileInfo[playerLeftNextX][playerBottomNextY]
                }
                break
            case ROUND_TILE_INFO.BOTTOM:
                examineTile = {
                    x,
                    y: playerBottomNextY,
                    ...tileInfo && tileInfo[x][playerBottomNextY]
                }
                break
            case ROUND_TILE_INFO.RIGHT_BOTTOM:
                examineTile = {
                    x: playerRightNextX,
                    y: playerBottomNextY,
                    ...tileInfo && tileInfo[playerRightNextX][playerBottomNextY]
                }
                break
        }

        if (!examineTile) {

        }

        roundTileInfo[key] = examineTile
    });

    return roundTileInfo
}

/**
 * 检测武器路径
 * @param x
 * @param y
 * @param tileInfo
 * @param expectTileType
 * @constructor
 */
export function ExaminePathWeapon (x: number, y: number, tileInfo: TileManager[][]) {
    const { mapRowCount, mapColumnCount } = DataManager.Instance
    // 玩家向上
    const weaponTopNextY = y - 2 < 0 ? 0 : y - 2
    // 玩家向下
    const weaponBottomNextY = y + 2 > mapColumnCount - 1 ? mapColumnCount - 1 : y + 2
    // 玩家向右
    const weaponRightNextX = x + 2 > mapRowCount - 1 ? mapRowCount - 1 : x + 2
    // 玩家向左
    const weaponLeftNextX = x - 2 < 0 ? 0 : x - 2

    let roundTileInfo: IRoundTile = {}

    console.log(mapRowCount, weaponRightNextX, tileInfo[weaponRightNextX])

    Object.keys(ROUND_TILE_INFO).forEach(key => {
        if (!isNaN(Number(key))) {
            return
        }

        let examineTile: TileManager | {x: number, y: number}

        switch (key) {
            case ROUND_TILE_INFO.TOP:
                examineTile = {
                    x,
                    y: weaponTopNextY,
                    ...tileInfo && tileInfo[x][weaponTopNextY]
                }
                break
            case ROUND_TILE_INFO.BOTTOM:
                examineTile = {
                    x,
                    y: weaponBottomNextY,
                    ...tileInfo && tileInfo[x][weaponBottomNextY]
                }
                break
            case ROUND_TILE_INFO.RIGHT:
                examineTile = {
                    x: weaponRightNextX,
                    y,
                    ...tileInfo && tileInfo[weaponRightNextX][y]
                }
                break
            case ROUND_TILE_INFO.LEFT:
                examineTile = {
                    x: weaponLeftNextX,
                    y,
                    ...tileInfo && tileInfo[weaponLeftNextX][y]
                }
                break
        }

        // @ts-ignore
        roundTileInfo[key] = examineTile ? examineTile : {}
    });

    return roundTileInfo
}

// 检测可行性
export function ExamineFeasibility (playerRoundInfo: IRoundTile = {}, weaponRoundInfo: IRoundTile = {}) {
    const {x: doorX, y: doorY, state: doorState} = DataManager.Instance.door || {
        x: 0,
        y: 0,
        state: ENTITY_STATE_ENUM.IDLE
    }
    const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH)
    const bursts = DataManager.Instance.bursts.filter(burst => burst.state !== ENTITY_STATE_ENUM.DEATH)

    console.log(playerRoundInfo, weaponRoundInfo)

    let status = true

    Object.keys(playerRoundInfo).map(key => {
        // 检测门
        if (status && playerRoundInfo[key] && playerRoundInfo[key]?.x === doorX && playerRoundInfo[key]?.y === doorY && doorState !== ENTITY_STATE_ENUM.DEATH) {
            status = false
        }

        if (status && playerRoundInfo[key] && enemies.filter(enemy => (playerRoundInfo[key]?.x === enemy.x && playerRoundInfo[key]?.y === enemy.y)).length) {
            status = false
        }

        // 检测地裂
        if (status && !playerRoundInfo[key].hasOwnProperty('type') && bursts.some(burst => (playerRoundInfo[key]?.x === burst.x && playerRoundInfo[key]?.y === burst.y))) {
            status = true
            return
        }

        if (status && !playerRoundInfo[key].hasOwnProperty('type') || !playerRoundInfo[key]?.moveAble) {
            status = false
        }
    })

    Object.keys(weaponRoundInfo).map(key => {
        // 检测门
        if (status && weaponRoundInfo[key] && weaponRoundInfo[key]?.x === doorX && weaponRoundInfo[key]?.y === doorY && doorState !== ENTITY_STATE_ENUM.DEATH) {
            status = false
        }

        if (status && weaponRoundInfo[key] && enemies.filter(enemy => (weaponRoundInfo[key]?.x === enemy.x && weaponRoundInfo[key]?.y === enemy.y)).length) {
            status = false
        }

        // 检测地裂
        if (status && !weaponRoundInfo[key].hasOwnProperty('type') && bursts.some(burst => (weaponRoundInfo[key]?.x === burst.x && weaponRoundInfo[key]?.y === burst.y))) {
            status = true
            return
        }

        if (status && weaponRoundInfo[key].hasOwnProperty('type') && !weaponRoundInfo[key]?.turnAble) {
            status = false
        }
    })

    return status
}

