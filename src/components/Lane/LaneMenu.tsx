import { Menu } from 'obsidian';
import Preact from 'preact/compat';

import { Path } from 'src/dnd/types';
import { t } from 'src/lang/helpers';

import { KanbanContext } from '../context';
import { c, generateInstanceId } from '../helpers';
import { Lane, LaneTemplate } from '../types';

export type LaneAction = 'delete' | null;

const actionLabels = {
  delete: {
    description: t(
      'Are you sure you want to delete this list and all its cards?'
    ),
    confirm: t('Yes, delete list'),
  },
};

export interface ConfirmActionProps {
  lane: Lane;
  action: LaneAction;
  cancel: () => void;
  onAction: () => void;
}

export function ConfirmAction({
  action,
  cancel,
  onAction,
  lane,
}: ConfirmActionProps) {
  Preact.useEffect(() => {
    // Immediately execute action if lane is empty
    if (action && lane.children.length === 0) {
      onAction();
    }
  }, [action, lane.children.length]);

  if (!action || (action && lane.children.length === 0)) return null;

  return (
    <div className={c('action-confirm-wrapper')}>
      <div className={c('action-confirm-text')}>
        {actionLabels[action].description}
      </div>
      <div>
        <button onClick={onAction} className={c('confirm-action-button')}>
          {actionLabels[action].confirm}
        </button>
        <button onClick={cancel} className={c('cancel-action-button')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export interface UseSettingsMenuParams {
  setIsEditing: Preact.StateUpdater<boolean>;
  path: Path;
  lane: Lane;
}

export function useSettingsMenu({
  setIsEditing,
  path,
  lane,
}: UseSettingsMenuParams) {
  const { stateManager, boardModifiers } = Preact.useContext(KanbanContext);
  const [confirmAction, setConfirmAction] = Preact.useState<LaneAction>(null);

  const settingsMenu = Preact.useMemo(() => {
    return new Menu()
      .addItem((item) => {
        item
          .setIcon('lucide-edit-3')
          .setTitle(t('Edit list'))
          .onClick(() => setIsEditing(true));
      })
      .addSeparator()
      .addItem((i) => {
        i.setIcon('corner-left-down')
          .setTitle(t('Insert list before'))
          .onClick(() =>
            boardModifiers.insertLane(path, {
              ...LaneTemplate,
              id: generateInstanceId(),
              children: [],
              data: {
                title: '',
                shouldMarkItemsComplete: false,
                forceEditMode: true,
              },
            })
          );
      })
      .addItem((i) => {
        i.setIcon('lucide-corner-right-down')
          .setTitle(t('Insert list after'))
          .onClick(() => {
            const newPath = [...path];

            newPath[newPath.length - 1] = newPath[newPath.length - 1] + 1;

            boardModifiers.insertLane(newPath, {
              ...LaneTemplate,
              id: generateInstanceId(),
              children: [],
              data: {
                title: '',
                shouldMarkItemsComplete: false,
                forceEditMode: true,
              },
            });
          });
      })
      .addSeparator()
      .addItem((item) => {
        item
          .setIcon('lucide-trash-2')
          .setTitle(t('Delete list'))
          .onClick(() => setConfirmAction('delete'));
      });
  }, [stateManager, setConfirmAction, path, lane]);

  return {
    settingsMenu,
    confirmAction,
    setConfirmAction,
  };
}
