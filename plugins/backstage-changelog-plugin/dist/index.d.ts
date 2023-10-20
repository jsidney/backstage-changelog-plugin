/// <reference types="react" />
import * as react from 'react';

type ChangelogAction = {
    name: string;
    counter: number;
    content: string;
    icon?: any;
};
type ChangelogProps = {
    versionNumber: string;
    actions: ChangelogAction[];
    versionContent: string | undefined;
};

/**
 * Props for {@link EntityChangelogCard}.
 *
 * @public
 */
interface ChangelogCardProps {
    parser?(content: string): ChangelogProps[];
}

declare const EntityChangelogCard: (props: ChangelogCardProps) => react.JSX.Element;

export { EntityChangelogCard };
