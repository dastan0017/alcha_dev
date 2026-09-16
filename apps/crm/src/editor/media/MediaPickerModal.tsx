import { useId, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MEDIA_QUERY_KEY, listMedia, uploadMedia } from '../../api/media';
import { Button, Dialog, IconButton } from '../ui';
import styles from './MediaPickerModal.module.css';

export interface MediaPickerModalProps {
  open: boolean;
  /** The chosen or freshly uploaded image URL; the modal calls `onClose` right after. */
  onPick: (url: string) => void;
  onClose: () => void;
}

/** Media library limited to images, with upload; opens above the editor drawer. */
export function MediaPickerModal({ open, onPick, onClose }: MediaPickerModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const pick = (url: string) => {
    onPick(url);
    onClose();
  };

  return (
    <Dialog
      open={open}
      placement="center"
      labelledBy={titleId}
      describedBy={descriptionId}
      className={styles.panel}
      onClose={onClose}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          Медиатека
        </h2>
        <p id={descriptionId} className={styles.subtitle}>
          Выберите файл или загрузите новый
        </p>
        <IconButton aria-label="Закрыть" className={styles.close} onClick={onClose}>
          ✕
        </IconButton>
      </header>
      <MediaGrid onPick={pick} />
    </Dialog>
  );
}

/** Mounted only while the dialog is open, so the library is fetched on demand. */
function MediaGrid({ onPick }: { onPick: (url: string) => void }) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const [fileError, setFileError] = useState<string | null>(null);

  const media = useQuery({ queryKey: MEDIA_QUERY_KEY, queryFn: listMedia });
  const upload = useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
    },
  });

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Lets the same file be chosen again after an error.
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Можно загрузить только изображение');
      return;
    }
    setFileError(null);
    // Per-call callback: it does not fire if the modal was closed during the upload.
    upload.mutate(file, { onSuccess: (asset) => onPick(asset.url) });
  };

  const images = (media.data ?? []).filter((asset) => asset.mimeType.startsWith('image/'));
  const uploadError =
    fileError ?? (upload.isError ? 'Не удалось загрузить файл — попробуйте ещё раз' : null);

  return (
    <div className={styles.body}>
      {uploadError && (
        <p role="alert" className={styles.error}>
          {uploadError}
        </p>
      )}
      <div className={styles.grid}>
        <div className={styles.uploadCell}>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            disabled={upload.isPending}
            className={styles.fileInput}
            onChange={handleFile}
          />
          <label htmlFor={inputId} className={styles.upload}>
            <span aria-hidden="true" className={styles.uploadIcon}>
              ↑
            </span>
            <span className={styles.uploadTitle}>
              {upload.isPending ? 'Загружаем…' : 'Загрузить с компьютера'}
            </span>
            <span className={styles.uploadHint}>JPG · PNG · WEBP</span>
          </label>
        </div>

        {images.map((asset) => (
          <button
            key={asset.id}
            type="button"
            title={asset.filename}
            className={styles.asset}
            onClick={() => onPick(asset.url)}
          >
            <span className={styles.thumb}>
              <img src={asset.url} alt="" loading="lazy" />
            </span>
            <span className={styles.name}>{asset.filename}</span>
          </button>
        ))}

        {media.isPending && (
          <p role="status" className={styles.note}>
            Загружаем медиатеку…
          </p>
        )}
        {media.isError && (
          <div role="alert" className={styles.note}>
            Не удалось открыть медиатеку.
            <Button variant="ghost" size="sm" onClick={() => media.refetch()}>
              Повторить
            </Button>
          </div>
        )}
        {media.isSuccess && images.length === 0 && (
          <p className={styles.note}>Здесь пока нет изображений — загрузите первое.</p>
        )}
      </div>
    </div>
  );
}
