/**
 * Custom Image Node for Lexical Editor
 * Supports image upload, resize, alt text, and delete
 */

import React, { useState, useCallback, useEffect } from 'react';
import { DecoratorNode, $getNodeByKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { indexedDBService } from '../../services/indexedDB';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export interface ImagePayload {
  altText: string;
  height?: number;
  maxWidth?: number;
  src: string;
  width?: number;
  imageId?: string;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    maxWidth: number;
    src: string;
    width?: number;
    imageId?: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __imageId: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__imageId,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, src, imageId } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
      imageId,
    });
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
      imageId: this.__imageId,
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    imageId?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__imageId = imageId || '';
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  getImageId(): string {
    return this.__imageId;
  }

  getAltText(): string {
    return this.__altText;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        imageId={this.__imageId}
        nodeKey={this.__key}
      />
    );
  }
}

/**
 * Helper to convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Image Component with Controls
 * Handles resize, alt text editing, delete, and persistence recovery from IndexedDB
 */
function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  imageId,
  nodeKey,
}: {
  src: string;
  altText: string;
  width: 'inherit' | number;
  height: 'inherit' | number;
  maxWidth: number;
  imageId: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isHovered, setIsHovered] = useState(false);
  const [showAltEditor, setShowAltEditor] = useState(false);
  const [editedAltText, setEditedAltText] = useState(altText);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // If initial src is already a valid data URL or external URL, display it immediately
  const isDataOrExternal = src && !src.startsWith('blob:');
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(imageId && !isDataOrExternal));
  const [hasError, setHasError] = useState<boolean>(false);

  // Restore image from IndexedDB whenever imageId is present
  useEffect(() => {
    let isMounted = true;

    if (!imageId) {
      setIsLoading(false);
      return;
    }

    // If src is an expired blob URL or empty, indicate loading
    if (!src || src.startsWith('blob:')) {
      setIsLoading(true);
    }
    setHasError(false);

    indexedDBService
      .getImage(imageId)
      .then(async (data) => {
        if (!isMounted) return;
        if (data) {
          let resolvedSrc: string;
          if (typeof data === 'string') {
            resolvedSrc = data;
          } else {
            resolvedSrc = await blobToDataUrl(data);
          }

          if (!isMounted) return;
          setImageSrc(resolvedSrc);
          setHasError(false);
          setIsLoading(false);
        } else {
          // If blob not found in IndexedDB, fallback to original src if it's a data URL
          if (src && !src.startsWith('blob:')) {
            setImageSrc(src);
            setHasError(false);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[ImageNode] Failed to load image from IndexedDB:', err);
        if (isMounted) {
          if (src && !src.startsWith('blob:')) {
            setImageSrc(src);
            setHasError(false);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageId, src]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      // Delete from IndexedDB
      if (imageId) {
        await indexedDBService.deleteImage(imageId);
      }

      // Revoke any blob URL if present
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
      if (src && src.startsWith('blob:') && src !== imageSrc) {
        URL.revokeObjectURL(src);
      }

      // Remove node from editor using $getNodeByKey
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      });

      if (import.meta.env.DEV) console.log(`✅ Deleted image: ${imageId}`);
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [imageId, imageSrc, src, editor, nodeKey]);

  const handleSaveAltText = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && node instanceof ImageNode) {
        node.setAltText(editedAltText);
      }
    });
    setShowAltEditor(false);
    if (import.meta.env.DEV) console.log(`✅ Updated alt text: "${editedAltText}"`);
  };

  return (
    <div
      className="inline-block my-4 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Resizable container */}
      <div
        className="resize overflow-auto inline-block rounded-lg border-2 border-transparent hover:border-accent-blue/30 transition-all duration-200"
        style={{
          maxWidth: maxWidth,
          resize: 'both',
        }}
      >
        {isLoading ? (
          <div
            className="flex items-center justify-center bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg animate-pulse border border-border-light dark:border-border-dark p-6"
            style={{
              width: width === 'inherit' ? '320px' : width,
              height: height === 'inherit' ? '180px' : height,
              maxWidth: maxWidth,
            }}
          >
            <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <span className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <span>加载图片中...</span>
            </div>
          </div>
        ) : hasError ? (
          <div
            className="flex flex-col items-center justify-center p-6 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-dashed border-border-light dark:border-border-dark rounded-lg text-text-light-tertiary dark:text-text-dark-tertiary"
            style={{
              width: width === 'inherit' ? '320px' : width,
              maxWidth: maxWidth,
            }}
          >
            <span className="text-2xl mb-1">🖼️</span>
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {altText || '图片加载失败'}
            </span>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={altText}
            style={{
              width: width === 'inherit' ? '100%' : width,
              height: height === 'inherit' ? 'auto' : height,
              display: 'block',
            }}
            className="max-w-full h-auto rounded-lg pointer-events-none"
            draggable={false}
            onError={() => setHasError(true)}
          />
        )}
      </div>

      {/* Hover controls - positioned below image with proper spacing */}
      {isHovered && !showAltEditor && (
        <div className="flex items-center justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setShowAltEditor(true)}
            className="px-3 py-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-accent-blue hover:text-white transition-colors shadow-elevated"
            title="编辑描述 (Alt text)"
          >
            ✏️ 图片描述
          </button>
          <button
            onClick={handleDeleteClick}
            className="px-3 py-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-accent-red hover:text-white transition-colors shadow-elevated"
            title="删除图片"
          >
            🗑️ 删除
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="删除图片"
        message="确定删除此图片吗？此操作无法撤销。"
        confirmText="删除"
        variant="danger"
      />

      {/* Alt text editor modal */}
      {showAltEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/50" onClick={() => setShowAltEditor(false)}>
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-elevated p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              编辑图片描述 (Alt Text)
            </h3>
            <textarea
              value={editedAltText}
              onChange={(e) => setEditedAltText(e.target.value)}
              className="w-full h-24 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue"
              placeholder="为屏幕阅读器或无障碍访问提供图片描述..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAltEditor(false)}
                className="px-4 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAltText}
                className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue-hover transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 800,
  src,
  width,
  imageId,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(src, altText, maxWidth, width, height, imageId, key);
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
