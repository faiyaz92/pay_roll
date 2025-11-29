# Payrole Development Guidelines & Conversation History

**Version:** 1.0  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Purpose:** Documentation of development approach and conversation history for AI navigation

## Development Methodology

### Document-Driven Development Approach

Payrole follows a structured document-driven development methodology where four interconnected documents maintain the project knowledge:

1. **BRD (Business Requirements Document)** - Business requirements and features
2. **Technical Documentation** - Implementation details, architecture, and code explanations
3. **Database Information** - Collection/document schemas, relationships, and query patterns
4. **Checklist** - Task tracking and implementation status

### Cross-Reference System

Each document section references corresponding sections in other documents:

```
BRD Section X → Technical-Doc Section Y → Checklist Task Z
```

This allows AI systems to navigate between business requirements, technical implementation, and task status seamlessly.

### Versioning Strategy

- **BRD-v1.md, BRD-v2.md, etc.** - Business requirement versions
- **Technical-Doc-v1.md, Technical-Doc-v2.md, etc.** - Technical implementation versions
- **Checklist-v1.md, Checklist-v2.md, etc.** - Task checklists per version

Each version documents the evolution of features from v1 to current version.

## Conversation History & Context

### Initial Project Setup (November 29, 2025)

**Context:** User cloned car-rental-app repository and wanted to convert it to a payroll/HR management system base.

**Key Actions:**
1. **Repository Setup:**
   - Cloned from https://github.com/faiyaz92/pay_roll.git
   - Set remote origin to pay_roll repository
   - Pushed initial codebase

2. **Project Cleaning:**
   - Removed all car-rental specific components and pages
   - Kept: Firebase integration, PWA features, Auth system, Cloudinary
   - Simplified to login + basic dashboard

3. **Branding Update:**
   - Changed app name to "Payrole HR Management"
   - Updated manifest.json with HR/payroll theme
   - Replaced car icons with user/HR icons
   - Updated HTML title and meta descriptions

4. **Documentation Setup:**
   - Created doc/ folder
   - Established BRD-Technical Doc-Checklist linkage system
   - Documented current v1.0 implementation

### Technical Implementation (v1.0)

**Core Features Implemented:**
- Firebase Authentication with role-based access
- PWA with service worker and install capability
- Responsive React dashboard
- Clean architecture with TypeScript

**Technology Stack:**
- React 18 + TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS + shadcn/ui
- Vite build system
- Vercel deployment

### Future Development Path

**Current Version (v1.0):** Complete GCC payroll platform with multi-role onboarding, employee master data, attendance tracking, leave policy automation, monthly payroll calculation linked to attendance, gratuity tracking, salary slip generation, and Wage Protection System (WPS) file export.

**Planned Versions:**  
- **v2.0:** Performance reviews and training records  
- **v3.0:** Advanced analytics and reporting  
- **v4.0:** Advanced HR features (recruitment, expense management)  
- **v5.0:** Enterprise-level capabilities

Each version will have corresponding BRD, Technical Doc, and Checklist updates.### GCC Payroll Expansion (v1.0 - Complete)

**Documents Updated (2025-11-29)**  
- `BRD-v1.md` – GCC payroll requirements (roles, attendance, leave, payroll, gratuity, WPS) and screen inventory.
- `Technical-Doc-v1.md` – architecture deltas, Cloud Functions plan, module/component design.
- `Database-Info-v1.md` – Firestore schemas for employees, attendance, leave policies, payroll cycles, WPS batches, salary slips.
- `Checklist-v1.md` – task breakdown covering onboarding, employee master data, attendance, leave, payroll, WPS, QA, deployment.

**Implementation Principles**  
1. **Role Provisioning:** Company Admin invokes a callable function (`createHrUser`) to register HR users in Firebase Auth. HR uses similar flow (`createEmployeeUser`) to onboard employees so they can sign in through the existing login page.  
2. **Employee Completeness:** Onboarding must capture GCC payroll essentials (basic salary ≥60% total, allowances, banking/IBAN, labour card, gratuity eligibility) to avoid WPS rejections/fines.  
3. **Attendance → Leave → Payroll:** Attendance feeds leave balances; unpaid leave automatically deducts from payroll. Half-day and absent statuses must translate into fractional payable days.  
4. **Leave Policy Automation:** HR defines PL/SL/CL entitlements and can run a quarterly accrual action that updates every employee with one click.  
5. **Payroll Review & WPS:** Payroll cycles support previews, manual bonuses/deductions, gratuity accrual, and produce WPS files only after validation passes. HR reviews before export; employees receive salary slips post-lock.

**Screen Coverage Reminder:** BRD-v1 Section 5 enumerates all UI flows (HR Management, Employee Directory, Attendance Calendar, Leave Management, Policy Builder, Payroll Wizard, WPS Preview, Salary Slip Center, Employee Self-Service, etc.). Every feature/task should map to at least one documented screen.## AI Navigation Guidelines

### How to Use This Documentation

1. **For Feature Implementation:**
   - Start with BRD section for business requirements
   - Reference Technical Doc for implementation details
   - Check Checklist for task status

2. **For Code Understanding:**
   - Technical Doc contains code snippets and architecture
   - Version history shows evolution
   - Firebase queries and API references included

3. **For Task Tracking:**
   - Checklist provides implementation status
   - Links to specific BRD and Technical sections
   - Time tracking and assignee information

### Cross-Document Navigation Examples

**Example 1: Login Feature**
- BRD-v1.md Section 3.1 → Technical-Doc-v1.md Section 4 → Checklist-v1.md Tasks 1.1-1.3

**Example 2: PWA Implementation**
- BRD-v1.md Section 3.3 → Technical-Doc-v1.md Section 2 → Checklist-v1.md Tasks 3.1-3.3

### Version Evolution Tracking

Each feature should be traceable through versions:
- **v1:** Basic implementation
- **v2:** Enhanced features
- **v3:** Optimization and additional functionality
- **v4:** Advanced features
- **v5:** Enterprise-level capabilities

## Development Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration
- Prettier code formatting
- Component composition over inheritance

### Documentation Standards
- Markdown format for all docs
- Cross-references between documents
- Version numbering for all changes
- Date and author tracking

### Git Workflow
- Feature branches for development
- Pull requests with documentation updates
- Version tags for releases
- Clean commit messages

## Contact & Support

For questions about this documentation or development approach:
- Reference this Guidelines.md document
- Check corresponding BRD/Technical Doc sections
- Review Checklist for current status

---

**Related Documents:**  
- BRD-v1.md  
- Technical-Doc-v1.md  
- Database-Info-v1.md  
- Checklist-v1.md**Next Update:** Guidelines-v2.md (Employee Management Features)