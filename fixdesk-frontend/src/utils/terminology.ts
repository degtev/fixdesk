export interface Terminology {
    singular: string;
    nominative: string;
    genitive: string;
    accusative: string;
}

export const getTerminology = (project: any): Terminology => {
    return {
        singular: project?.item_name_singular || 'задача',
        nominative: project?.item_name_nominative || 'задачи',
        genitive: project?.item_name_genitive || 'задач',
        accusative: project?.item_name_accusative || 'задачу'
    };
};

export const formatAddButton = (term: Terminology): string => {
    return `Добавить ${term.accusative}`;
};

export const formatCount = (count: number, term: Terminology): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return `${count} ${term.genitive}`;
    }

    if (lastDigit === 1) {
        return `${count} ${term.singular}`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return `${count} ${term.nominative}`;
    }

    return `${count} ${term.genitive}`;
};

export const formatListTitle = (term: Terminology): string => {
    return `Список ${term.genitive}`;
};

export const formatEditTitle = (term: Terminology): string => {
    return `Редактировать ${term.accusative}`;
};

export const formatDeleteTitle = (term: Terminology): string => {
    return `Удалить ${term.accusative}`;
};

export const formatViewTitle = (term: Terminology): string => {
    return `Просмотр ${term.genitive}`;
};

export const formatCreateTitle = (term: Terminology): string => {
    return `Создать ${term.accusative}`;
};

export const formatEmptyState = (term: Terminology): string => {
    return `Нет ${term.genitive}`;
};

export const formatCountOfTotal = (current: number, total: number, term: Terminology): string => {
    const currentFormatted = formatCount(current, term);
    const totalFormatted = formatCount(total, term);

    return `${current} из ${totalFormatted}`;
};

export const formatProgress = (current: number, total: number, term: Terminology): string => {
    return `${formatCount(current, term)} из ${total}`;
};

export const formatEmptyTitle = (count: number, filterType: string, term: Terminology): string => {
    if (count === 0) {
        return `${capitalize(term.genitive)} пока нет`;
    }
    if (filterType === 'assigned_to_me') {
        return `Вам не назначено ${term.genitive}`;
    }
    return `${capitalize(term.nominative)} не найдены`;
};

export const formatEmptyDescription = (count: number, filterType: string, term: Terminology): string => {
    if (count === 0) {
        return `Создайте первую ${term.accusative}`;
    }
    if (filterType === 'assigned_to_me') {
        return `Попробуйте изменить фильтр или попросите назначить вам ${term.singular}`;
    }
    return 'Попробуйте изменить фильтры или сортировку';
};

const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
