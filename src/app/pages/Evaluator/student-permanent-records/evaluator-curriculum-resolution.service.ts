import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Course } from '../../../core/models/course.model';
import { Curricula } from '../../../core/models/curricula.model';
import { Student } from '../../../core/models/student.model';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { ProgramService } from '../../Admin/program-management/program.service';
import { CourseService } from '../../Registrar/curriculum-management/course.service';
import { CurriculumManagementService } from '../../Registrar/curriculum-management/curriculum-management.service';
import {
  resolveEffectiveCurriculum,
  resolveEffectiveCurriculumCode
} from './evaluator-curriculum-resolution.util';

const BULK_PAGE = { PageIndex: 1, PageSize: 500, SortDirection: SORT_DEFAULTS.DIRECTION, SortKey: '' } as const;

export interface ResolvedCurriculumContext {
  readonly programCurricula: readonly Curricula[];
  readonly curricula: Curricula | null;
  readonly curriculumCode: string | null;
  readonly courses: readonly Course[];
}

@Injectable({ providedIn: 'root' })
export class EvaluatorCurriculumResolutionService {
  private readonly programService = inject(ProgramService);
  private readonly curriculumService = inject(CurriculumManagementService);
  private readonly courseService = inject(CourseService);

  loadProgramCurricula(student: Student): Observable<readonly Curricula[]> {
    const programCode = student.programCode?.trim();
    if (!programCode) {
      return of([]);
    }

    return this.programService.getPrograms({ ...BULK_PAGE, searchTerm: programCode }).pipe(
      switchMap((programsRes) => {
        const program = (programsRes.data ?? []).find(
          (item) => item.programCode.trim().toLowerCase() === programCode.toLowerCase()
        );

        const request = program?.programId != null
          ? this.curriculumService.getCurricula({ ...BULK_PAGE, programId: program.programId })
          : this.curriculumService.getCurricula(BULK_PAGE);

        return request.pipe(
          map((res) =>
            (res.data ?? []).filter(
              (curriculum) => curriculum.programCode?.trim().toLowerCase() === programCode.toLowerCase()
            )
          )
        );
      }),
      catchError(() => of([]))
    );
  }

  resolveCurriculumContext(student: Student): Observable<ResolvedCurriculumContext> {
    return this.loadProgramCurricula(student).pipe(
      switchMap((programCurricula) => {
        const curricula = resolveEffectiveCurriculum(student, programCurricula);
        const curriculumCode = resolveEffectiveCurriculumCode(student, programCurricula);

        if (!curriculumCode) {
          return of({
            programCurricula,
            curricula,
            curriculumCode: null,
            courses: []
          });
        }

        return this.courseService.getCourses({ ...BULK_PAGE, curriculumCode }).pipe(
          map((res) => ({
            programCurricula,
            curricula,
            curriculumCode,
            courses: res.data ?? []
          })),
          catchError(() =>
            of({
              programCurricula,
              curricula,
              curriculumCode,
              courses: []
            })
          )
        );
      }),
      catchError(() =>
        of({
          programCurricula: [],
          curricula: null,
          curriculumCode: student.curriculumCode?.trim() || null,
          courses: []
        })
      )
    );
  }
}
