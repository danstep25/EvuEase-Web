import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { StudentPermanentRecordsService } from './student-permanent-records.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';

@Component({
  selector: 'app-student-permanent-records',
  standalone: true,
  imports: [CommonModule, SearchableSelectComponent],
  templateUrl: './student-permanent-records.component.html',
  styleUrl: './student-permanent-records.component.scss'
})
export class StudentPermanentRecordsComponent implements OnInit {
  private readonly recordsService = inject(StudentPermanentRecordsService);

  readonly pageTitle = 'Student Permanent Records';
  readonly pageSubtitle = 'View student academic history and grades';

  studentOptions: SearchableSelectOption[] = [];
  isLoadingStudents = true;
  loadError: string | null = null;
  selectedStudentId: string | null = null;

  ngOnInit(): void {
    this.recordsService
      .getStudentOptions()
      .pipe(finalize(() => (this.isLoadingStudents = false)))
      .subscribe({
        next: (rows) => {
          this.studentOptions = rows;
          this.loadError = null;
        },
        error: () => {
          this.studentOptions = [];
          this.loadError = 'Unable to load the student list. Please try again later.';
        }
      });
  }

  get selectedSummary(): SearchableSelectOption | null {
    if (!this.selectedStudentId) {
      return null;
    }
    return this.studentOptions.find((o) => o.id === this.selectedStudentId) ?? null;
  }
}
