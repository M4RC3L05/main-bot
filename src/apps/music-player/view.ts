import {
  MessageActionRow,
  MessageButton,
  MessageButtonOptions,
  WebhookEditMessageOptions,
} from "discord.js";
import { APIButtonComponent } from "discord-api-types";
import { MusicInfo } from "#src/apps/music-player/player/sources/player-source.js";
import { PlayerActions } from "#src/apps/music-player/commands.js";

export type PlayerActionsComponentProps = {
  buttons: Array<MessageButton | MessageButtonOptions | APIButtonComponent>;
};

export const playerActionsComponent = ({
  buttons,
}: PlayerActionsComponentProps) => {
  return [
    new MessageActionRow().addComponents(
      ...Object.values(buttons).map((button) => new MessageButton(button)),
    ),
  ];
};

export type ViewProps = {
  isPaused: boolean;
  isStopped: boolean;
  position: string;
  total: string;
  music: MusicInfo;
  currentEmoji: string;
};

export const playerView = ({
  isPaused,
  isStopped,
  position,
  total,
  music,
  currentEmoji,
}: ViewProps): WebhookEditMessageOptions => {
  const buttons: Array<
    MessageButton | MessageButtonOptions | APIButtonComponent
  > = [
    {
      customId: PlayerActions.PREVIOUS,
      label: "⬅️",
      style: "PRIMARY",
    },
    {
      customId: isPaused ? PlayerActions.RESUME : PlayerActions.PAUSE,
      label: isPaused ? "▶️" : "⏸️",
      style: "PRIMARY",
    },
    {
      customId: PlayerActions.STOP,
      label: "⏹️",
      style: "PRIMARY",
      disabled: isStopped,
    },
    {
      customId: PlayerActions.NEXT,
      label: "➡️",
      style: "PRIMARY",
    },
    {
      customId: PlayerActions.CLOSE,
      label: "✖️",
      style: "PRIMARY",
    },
  ];

  return {
    content: `${position} / ${total} ${currentEmoji} Now playing: ${music.title}`,
    components: playerActionsComponent({ buttons }),
    embeds: music.thumb
      ? [{ image: { ...music.thumb, width: 300, height: 300 } }]
      : [],
  };
};
