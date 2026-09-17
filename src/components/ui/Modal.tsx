"use client";

import { Button, Modal } from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 45: ConfirmDialog wrapper for popups
  (e.g. suspend-user confirmation — never "ban" vocabulary).
  Controlled via isOpen/onOpenChange, or uncontrolled with a trigger.
*/

interface ConfirmDialogProps {
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  danger?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function ConfirmDialog({
  trigger,
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  danger = false,
  size = "sm",
}: ConfirmDialogProps) {
  return (
    <Modal>
      {isOpen === undefined && trigger}
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
        <Modal.Container size={size}>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            {description && (
              <Modal.Body>
                <p className="text-sm leading-6 text-zinc-400">{description}</p>
              </Modal.Body>
            )}
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                {cancelText}
              </Button>
              <Button
                slot="close"
                variant={danger ? "danger" : undefined}
                onPress={onConfirm}
              >
                {confirmText}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
