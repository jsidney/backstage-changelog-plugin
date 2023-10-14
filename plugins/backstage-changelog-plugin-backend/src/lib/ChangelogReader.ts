import fs from 'fs-extra';

export const readChangelogFile = async (
    changeLogFileReference: string
) : Promise<string> => {
    const result = fs.readFileSync(changeLogFileReference);
    return result.toString('utf8');
}