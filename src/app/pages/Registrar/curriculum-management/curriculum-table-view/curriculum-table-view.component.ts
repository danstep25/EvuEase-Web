import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '../../../../core/models/course.model';
import { Curricula } from '../../../../core/models/curricula.model';
import { Program } from '../../../../core/models/program.model';

@Component({
  selector: 'app-curriculum-table-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curriculum-table-view.component.html',
  styleUrl: './curriculum-table-view.component.scss'
})
export class CurriculumTableViewComponent {
  @Input() courses: Course[] = [];
  @Input() programs: Program[] = [];
  @Input() curricula: Curricula[] = [];
  @Input() isLoadingCourses: boolean = false;
  @Input() isLoadingCurricula: boolean = false;
  @Input() selectedProgramFilter: number | null = null;
  @Input() selectedCurriculumFilter: string | null = null;

  @Output() programFilterChange = new EventEmitter<number | null>();
  @Output() curriculumFilterChange = new EventEmitter<string | null>();

  getSelectedProgram(): Program | null {
    if (!this.selectedProgramFilter) return null;
    return this.programs.find(p => p.programId === this.selectedProgramFilter) || null;
  }

  getSelectedCurriculum(): Curricula | null {
    if (!this.selectedCurriculumFilter) return null;
    return this.curricula.find(c => c.curriculumCode === this.selectedCurriculumFilter) || null;
  }

  getCoursesByYearAndSemester(): { [year: string]: { [semester: string]: Course[] } } {
    const grouped: { [year: string]: { [semester: string]: Course[] } } = {};
    
    this.courses.forEach(course => {
      const year = course.courseYearLevel;
      const semester = course.courseSemester;
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][semester]) {
        grouped[year][semester] = [];
      }
      grouped[year][semester].push(course);
    });
    
    return grouped;
  }

  getYearDisplayName(year: string): string {
    const yearMap: { [key: string]: string } = {
      'Year 1': 'FIRST YEAR',
      'Year 2': 'SECOND YEAR',
      'Year 3': 'THIRD YEAR',
      'Year 4': 'FOURTH YEAR',
      'Year 5': 'FIFTH YEAR'
    };
    return yearMap[year] || year.toUpperCase();
  }

  getTotalUnitsForSemester(courses: Course[]): number {
    return courses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getTotalCourses(): number {
    return this.courses.length;
  }

  getTotalUnits(): number {
    return this.courses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getYearsToComplete(): number {
    const program = this.getSelectedProgram();
    return program?.programCompletionYears || 0;
  }

  getSortedYears(): string[] {
    const yearOrder = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const grouped = this.getCoursesByYearAndSemester();
    return yearOrder.filter(year => grouped[year]);
  }

  onProgramFilterChange(value: number | string | null): void {
    let programId: number | null = null;
    
    if (value === null || value === '' || value === 'null' || value === undefined) {
      programId = null;
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      programId = isNaN(parsed) ? null : parsed;
    } else {
      programId = value;
    }
    
    console.log('Curriculum Table View - Program filter changed:', value, '->', programId);
    this.programFilterChange.emit(programId);
  }

  onCurriculumFilterChange(value: string | null): void {
    this.curriculumFilterChange.emit(value);
  }
}

