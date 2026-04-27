import { Container, Graphics } from 'pixi.js';
import { CARD_STAGE, TRANSFER_SHADOW } from '../configs/AceOfShadowsConfig';
import { CARD } from '../configs/CardVisualConfig';

export function createTransferShadowVisual(): Container {
  const shadowWidth = CARD.width * CARD_STAGE.scaleX;
  const shadow = new Container();

  for (const layer of TRANSFER_SHADOW.layers) {
    const width = shadowWidth * layer.widthScale;
    const height = TRANSFER_SHADOW.height * layer.heightScale;

    shadow.addChild(
      new Graphics()
        .roundRect(
          -width / 2,
          TRANSFER_SHADOW.centerYOffset + layer.yOffset - height / 2,
          width,
          height,
          layer.radius,
        )
        .fill({ color: 0x000000, alpha: layer.alpha }),
    );
  }

  return shadow;
}
