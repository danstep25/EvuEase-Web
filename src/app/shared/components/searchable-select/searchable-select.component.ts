import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableSelectOption } from './searchable-select-option.model';

export type { SearchableSelectOption } from './searchable-select-option.model';

let searchableSelectUid = 0;

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss'
})
export class SearchableSelectComponent implements OnChanges {
  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('filterInput') private filterInput?: ElementRef<HTMLInputElement>;

  private readonly uid = `searchable-select-${++searchableSelectUid}`;
  readonly labelId = `${this.uid}-label`;
  readonly inputId = `${this.uid}-input`;
  readonly listboxId = `${this.uid}-listbox`;

  @Input({ required: true }) options: SearchableSelectOption[] = [];
  @Input() label = '';
  
  @Input() hideSearchIcon = false;
  
  @Input() ariaLabelledBy: string | null = null;
  
  @Input() listHeading: string | null = null;
  
  @Input() panelPlacement: 'below' | 'above' = 'below';
  
  @Input() optionDisplayInline = false;
  @Input() placeholder = 'Type to search or click to select...';
  @Input() isLoading = false;
  @Input() emptyText = 'No students match your search.';
  @Input() selectedId: string | null = null;
  /** When true, options are already filtered by the parent (e.g. server-side search). */
  @Input() externalFilter = false;

  @Output() readonly selectedIdChange = new EventEmitter<string | null>();
  @Output() readonly searchTextChange = new EventEmitter<string>();

  isOpen = false;
  searchText = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedId']) {
      this.syncDisplayFromSelection();
      return;
    }
    if (changes['options']) {
      if (this.selectedId || !this.isOpen) {
        this.syncDisplayFromSelection();
      }
    }
  }

  get selectedOption(): SearchableSelectOption | null {
    if (!this.selectedId) {
      return null;
    }
    return this.options.find((o) => o.id === this.selectedId) ?? null;
  }

  get filteredOptions(): SearchableSelectOption[] {
    const q = this.searchText.trim().toLowerCase();
    if (this.externalFilter && q.length >= 2) {
      return this.options;
    }
    if (!q) {
      return this.options;
    }
    return this.options.filter((o) => {
      if (this.optionDisplayInline) {
        const label = this.getOptionLabel(o).toLowerCase();
        return label.includes(q);
      }
      return (
        o.primary.toLowerCase().includes(q) || o.secondary.toLowerCase().includes(q)
      );
    });
  }

  getOptionLabel(o: SearchableSelectOption): string {
    return o.secondary ? `${o.primary} - ${o.secondary}` : o.primary;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const target = event.target as Node | null;
    if (!target || this.host.nativeElement.contains(target)) {
      return;
    }
    this.closePanel();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.isOpen) {
      return;
    }
    event.preventDefault();
    this.closePanel();
  }

  onChevronClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isLoading) {
      return;
    }
    this.togglePanel();
  }

  onInputFocus(): void {
    if (this.isLoading) {
      return;
    }
    const alreadyOpen = this.isOpen;
    this.isOpen = true;
    if (!alreadyOpen) {
      const keepFilterText =
        this.hideSearchIcon && this.optionDisplayInline && !!this.selectedOption;
      if (!keepFilterText) {
        this.searchText = '';
        this.searchTextChange.emit('');
      }
    }
  }

  onInputInput(): void {
    if (!this.isOpen) {
      this.isOpen = true;
    }
    this.searchTextChange.emit(this.searchText);
  }

  selectOption(option: SearchableSelectOption, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedIdChange.emit(option.id);
    this.searchText = this.optionDisplayInline ? this.getOptionLabel(option) : option.primary;
    this.isOpen = false;
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedIdChange.emit(null);
    this.searchText = '';
    this.isOpen = true;
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const keepFilterText =
        this.hideSearchIcon && this.optionDisplayInline && !!this.selectedOption;
      if (!keepFilterText) {
        this.searchText = '';
        this.searchTextChange.emit('');
      }
      queueMicrotask(() => this.filterInput?.nativeElement?.focus());
    } else {
      this.syncDisplayFromSelection();
    }
  }

  private closePanel(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.syncDisplayFromSelection();
  }

  private syncDisplayFromSelection(): void {
    const sel = this.selectedOption;
    if (!sel) {
      this.searchText = '';
      return;
    }
    this.searchText = this.optionDisplayInline ? this.getOptionLabel(sel) : sel.primary;
  }

  trackById(_index: number, item: SearchableSelectOption): string {
    return item.id;
  }
}

