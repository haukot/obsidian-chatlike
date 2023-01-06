import { moment } from 'obsidian';
import Preact from 'preact/compat';
import useOnclickOutside from 'react-cool-onclickoutside';

import { t } from 'src/lang/helpers';
import { buildLinkToDailyNote } from 'src/helpers';

import { KanbanContext } from '../context';
import { getDropAction, handlePaste } from '../Editor/helpers';
import { MarkdownEditor, allowNewLine } from '../Editor/MarkdownEditor';
import { c } from '../helpers';
import { Item } from '../types';

interface ItemFormProps {
  addItems: (items: Item[]) => void;
  isInputVisible: boolean;
  setIsInputVisible: Preact.StateUpdater<boolean>;
  setEditLastItem: (e: KeyboardEvent) => void;
  hookFocus: (Function) => void;
  hideButton?: boolean;
}

export function ItemForm({
  addItems,
  isInputVisible,
  setEditLastItem,
  setIsInputVisible,
  hookFocus,
  hideButton,
}: ItemFormProps) {
  const [itemTitle, setItemTitle] = Preact.useState('');
  const { stateManager, view } = Preact.useContext(KanbanContext);
  const inputRef = Preact.useRef<HTMLTextAreaElement>();

  Preact.useEffect(() => {
      // () => () because first function react uses as initialization function and runs it
      hookFocus(() => { return () => inputRef.current.focus() });
  }, []);

  Preact.useEffect(() => {
    inputRef.current.focus()
  }, []);

  const clickOutsideRef = useOnclickOutside(
    () => {
      // не хочу чтоб в кнопку превращалось
      //setIsInputVisible(false);
    },
    {
      ignoreClass: c('ignore-click-outside'),
    }
  );

  const clear = Preact.useCallback(() => {
    setItemTitle('');
    setIsInputVisible(false);
  }, []);

  const addItemsFromStrings = async (titles: string[]) => {
    try {
      addItems(
        await Promise.all(
          titles.map((title) => {
            return stateManager.getNewItem(title);
          })
        )
      );
    } catch (e) {
      stateManager.setError(e);
    }
  };

  const saveItem = () => {
    let title = itemTitle.trim();

    if (!title) return;
    // добавляем текущую дату
    const dateFormat = stateManager.getSetting('date-format');
    const timeFormat = stateManager.getSetting('time-format');
    const shouldLinkDates = stateManager.getSetting('link-date-to-daily-note');
    const dateTrigger = stateManager.getSetting('date-trigger');
    const timeTrigger = stateManager.getSetting('time-trigger');

    const time = moment().format(timeFormat);
    const formattedDate = moment().format(dateFormat);
    const wrappedDate = shouldLinkDates
      ? buildLinkToDailyNote(stateManager.app, formattedDate)
      : `{${formattedDate}}`;
    title = `${dateTrigger}${wrappedDate}\n\n${title}`

    addItemsFromStrings([title]);
    setItemTitle('');
  }

  const onEnter = (e: KeyboardEvent) => {
    if (!allowNewLine(e, stateManager)) {
      e.preventDefault();

      saveItem()
    }
  };

  const onEscape = (e: KeyboardEvent) => {
    inputRef.current.blur()
  };

  const onSubmit = () => {
    saveItem()
  };

  if (isInputVisible) {
    return (
      <div className={c('item-form')} ref={clickOutsideRef}>
        <div className={c('item-input-wrapper')}>
          <MarkdownEditor
            ref={inputRef}
            className={c('item-input')}
            placeholder={'Соблаговолите написать письмо..'}
            onEnter={onEnter}
            onEscape={onEscape}
            onSubmit={onSubmit}
            value={itemTitle}
            onChange={(e) => {
              setItemTitle((e.target as HTMLTextAreaElement).value);
            }}
            onArrowUp={(e) => {
              setEditLastItem(e);
            }}
            onPaste={(e) => {
              handlePaste(e, stateManager, view.getWindow());
            }}
          />
        </div>
      </div>
    );
  }

  if (hideButton) return null;

  return (
    <div className={c('item-button-wrapper')}>
      <button
        className={c('new-item-button')}
        onClick={() => setIsInputVisible(true)}
        onDragOver={(e) => {
          if (getDropAction(stateManager, e.dataTransfer)) {
            setIsInputVisible(true);
          }
        }}
      >
        <span className={c('item-button-plus')}>+</span> {t('Add a card')}
      </button>
    </div>
  );
}
