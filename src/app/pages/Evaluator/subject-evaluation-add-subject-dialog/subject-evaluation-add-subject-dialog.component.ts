import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  filterAddSubjectCatalog,
  getAddSubjectCatalog,
  type AddSubjectCatalogItem
} from '../../../../mock-data/evaluator/subject-evaluation-add-subject.mock';

@Component({
  selector: 'app-subject-evaluation-add-subject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-evaluation-add-subject-dialog.component.html',
  styleUrl: './subject-evaluation-add-subject-dialog.component.scss'
})
export class SubjectEvaluationAddSubjectDialogComponent {
  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Input() excludeCourseCodes: readonly string[] = [];
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly subjectAdded = new EventEmitter<AddSubjectCatalogItem>();

  searchQuery = '';

  get catalog() {
    return getAddSubjectCatalog(this.studentId);
  }

  get searchResults(): readonly AddSubjectCatalogItem[] {
    return filterAddSubjectCatalog(this.catalog, this.searchQuery, this.excludeCourseCodes);
  }

  get hasSearchQuery(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  get hasSearchResults(): boolean {
    return this.searchResults.length > 0;
  }

  get showEmptyState(): boolean {
    return !this.hasSearchQuery || !this.hasSearchResults;
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.searchQuery = '';
    this.closed.emit();
  }

  onAddSubject(item: AddSubjectCatalogItem): void {
    this.subjectAdded.emit(item);
  }

  isPrerequisiteNone(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() === 'none';
  }

  trackCatalogItem(_index: number, item: AddSubjectCatalogItem): string {
    return item.courseCode;
  }
}
