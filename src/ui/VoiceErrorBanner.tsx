/**
 * @module ui/VoiceErrorBanner
 * @description Inline voice-input error, shown in the chat section above the
 * composer. Uses the same error tone as StatusBanner. Announced via role=alert.
 */

import { css } from "@emotion/react";

interface VoiceErrorBannerProps {
  message: string;
}

const wrap = css`
  padding: 12px 12px 0;
  flex-shrink: 0;
`;

const card = css`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecdca;
  background: #fef3f2;
  border-radius: 12px;
  padding: 10px 12px;
`;

const text = css`
  font-size: 13px;
  line-height: 1.4;
  color: #b42318;
`;

export function VoiceErrorBanner({ message }: VoiceErrorBannerProps) {
  return (
    <div css={wrap}>
      <div css={card} role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" css={css`flex-shrink: 0;`}>
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="#b42318"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span css={text}>{message}</span>
      </div>
    </div>
  );
}
