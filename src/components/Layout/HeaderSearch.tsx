'use client';

import { cn, IconSearch } from '@heroui/react';
import { FC, Key, useEffect, useMemo, useRef, useState } from 'react';
import {
    Autocomplete,
    Button,
    Collection,
    Dialog,
    DialogTrigger,
    Header as ListHeader,
    Input,
    Menu,
    MenuItem,
    MenuSection,
    Popover,
    SearchField,
    ToggleButton,
    ToggleButtonGroup,
} from 'react-aria-components';
import useSWR from 'swr';

import Icon from '@/components/Icons/Icon';
import PreviewLine from '@/components/PreviewLine/PreviewLine';
import { selectableRowClass } from '@/lib/styles';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { instanceDisplayName } from '@/lib/valueDisplay';
import { searchEntities, searchUrl } from '@/services/backend/search';
import { PreviewItem, SearchType } from '@/types/backend';

const SEARCH_DEBOUNCE_MS = 250;

const TYPE_OPTIONS: { id: SearchType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'class', label: 'Classes' },
    { id: 'instance', label: 'Instances' },
];

type SearchOption = { id: string; text: string; preview?: { items: PreviewItem[]; truncated: boolean } };
type SearchSection = { id: string; label: string; options: SearchOption[] };
type OptionTarget = { kind: 'class' | 'instance'; id: string; types: string[] };

/** Header search over the whole knowledge base; picking a result drives the pane selection. */
const HeaderSearch: FC = () => {
    const { selectClass, selectInstance, alignClassWithInstanceTypes } = useExplorerSelection();
    const [text, setText] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('all');
    const [query, setQuery] = useState({ text: '', type: 'all' as SearchType });
    const [isDismissed, setIsDismissed] = useState(false);
    const fieldRef = useRef<HTMLDivElement>(null);

    // Immediate, not debounced: a cleared input must not show stale results.
    // Every path that empties the input must call this.
    const clearQuery = () => setQuery((previous) => (previous.text === '' ? previous : { ...previous, text: '' }));

    const trimmedText = text.trim();
    useEffect(() => {
        if (!trimmedText) {
            return;
        }
        const handle = setTimeout(() => setQuery({ text: trimmedText, type: searchType }), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [trimmedText, searchType]);

    const { data, error } = useSWR(query.text ? ([searchUrl, query.text, query.type] as const) : null, ([, queryText, queryType]) =>
        searchEntities(queryText, queryType),
    );

    const { sections, targets } = useMemo(() => {
        const builtSections: SearchSection[] = [];
        const builtTargets = new Map<Key, OptionTarget>();
        const { classes = [], instances = [] } = data ?? {};
        if (classes.length > 0) {
            builtSections.push({
                id: 'classes',
                label: 'Classes',
                options: classes.map((result) => ({ id: `class:${result.id}`, text: result.id })),
            });
            for (const result of classes) {
                builtTargets.set(`class:${result.id}`, { kind: 'class', id: result.id, types: [] });
            }
        }
        if (instances.length > 0) {
            builtSections.push({
                id: 'instances',
                label: 'Instances',
                options: instances.map((result) => ({
                    id: `instance:${result.id}`,
                    text: instanceDisplayName(result),
                    preview: { items: result.property_preview, truncated: result.preview_truncated },
                })),
            });
            for (const result of instances) {
                builtTargets.set(`instance:${result.id}`, { kind: 'instance', id: result.id, types: result.types });
            }
        }
        return { sections: builtSections, targets: builtTargets };
    }, [data]);

    // The live input must be non-empty too: a stale debounced query alone must never open the popover.
    const isOpen = !isDismissed && query.text !== '' && trimmedText !== '';
    const status = error ? 'Search failed' : data === undefined ? 'Searching…' : sections.length === 0 ? 'No matches' : null;

    const handleAction = (key: Key) => {
        const target = targets.get(key);
        if (target === undefined) {
            return;
        }
        if (target.kind === 'class') {
            selectClass(target.id);
        } else {
            selectInstance(target.id);
            alignClassWithInstanceTypes(target.types);
        }
        setText('');
        clearQuery();
    };

    return (
        <Autocomplete
            inputValue={text}
            onInputChange={(value) => {
                setText(value);
                setIsDismissed(false);
                if (!value.trim()) {
                    clearQuery();
                }
            }}
        >
            <div ref={fieldRef} className="hidden h-8 w-56 items-center gap-1 rounded-lg border border-border bg-surface px-2 md:flex">
                <IconSearch className="size-4 shrink-0 text-muted" />
                {/* SearchField, not a bare Input: it consumes the Autocomplete's
                    field context (a bare Input is not wired to it). */}
                <SearchField aria-label="Search the knowledge base" className="min-w-0 flex-1">
                    <Input placeholder="Search…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
                </SearchField>
                <DialogTrigger>
                    <Button
                        aria-label={`Search filter: ${TYPE_OPTIONS.find((option) => option.id === searchType)?.label}`}
                        className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded outline-none hover:text-foreground focus-visible:outline focus-visible:outline-focus',
                            searchType === 'all' ? 'text-muted' : 'text-accent',
                        )}
                    >
                        <Icon>
                            <path d="M4 6h16M7 12h10m-7 6h4" strokeLinecap="round" />
                        </Icon>
                    </Button>
                    <Popover placement="bottom end">
                        <Dialog aria-label="Search filter options" className="rounded-lg border border-border bg-surface p-1 shadow-lg outline-none">
                            {({ close }) => (
                                <ToggleButtonGroup
                                    selectionMode="single"
                                    disallowEmptySelection
                                    selectedKeys={[searchType]}
                                    onSelectionChange={(keys) => {
                                        setSearchType([...keys][0] as SearchType);
                                        close();
                                    }}
                                    className="flex flex-col"
                                >
                                    {TYPE_OPTIONS.map((option) => (
                                        <ToggleButton
                                            key={option.id}
                                            id={option.id}
                                            className={({ isSelected }) =>
                                                selectableRowClass(isSelected, 'cursor-pointer px-3 py-1 text-left text-sm')
                                            }
                                        >
                                            {option.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            )}
                        </Dialog>
                    </Popover>
                </DialogTrigger>
            </div>
            <Popover
                triggerRef={fieldRef}
                isOpen={isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDismissed(true);
                    }
                }}
                isNonModal
                placement="bottom end"
                className="max-h-96 w-80 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
            >
                {status !== null ? (
                    <div className="px-2 py-1.5 text-sm text-muted">{status}</div>
                ) : (
                    <Menu items={sections} onAction={handleAction} aria-label="Search results" className="text-sm outline-none">
                        {(section) => (
                            <MenuSection id={section.id}>
                                <ListHeader className="px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase">
                                    {section.label}
                                </ListHeader>
                                <Collection items={section.options}>
                                    {(option) => (
                                        <MenuItem
                                            id={option.id}
                                            textValue={option.text}
                                            className={({ isFocused }) =>
                                                selectableRowClass(false, 'cursor-pointer px-2 py-1.5', isFocused && 'bg-default-soft')
                                            }
                                        >
                                            <span className="block truncate">{option.text}</span>
                                            {option.preview && <PreviewLine preview={option.preview.items} truncated={option.preview.truncated} />}
                                        </MenuItem>
                                    )}
                                </Collection>
                            </MenuSection>
                        )}
                    </Menu>
                )}
            </Popover>
        </Autocomplete>
    );
};

export default HeaderSearch;
