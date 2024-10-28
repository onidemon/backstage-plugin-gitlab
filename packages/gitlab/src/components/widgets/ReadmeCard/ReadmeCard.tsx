import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import Alert from '@material-ui/lab/Alert';
import {
    InfoCard,
    Progress,
    InfoCardVariants,
} from '@backstage/core-components';
import { GitlabCIApiRef } from '../../../api';
import { useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import {
    gitlabProjectId,
    gitlabProjectSlug,
    gitlabReadmePath,
    gitlabInstance,
} from '../../gitlabAppData';
import gfm from 'remark-gfm';
import toc from 'remark-toc';
import removeComments from 'remark-remove-comments';
import gemoji from 'remark-gemoji';
import rehypePrism from 'rehype-prism';
import rehypeRaw from 'rehype-raw';
import 'prismjs/themes/prism.css';
import { parseGitLabReadme } from '../../utils';

// Custom styles for markdown-rendered elements to ensure consistent styling
const useStyles = makeStyles((theme) => ({
    infoCard: {
        marginBottom: theme.spacing(3),
        '& + .MuiAlert-root': {
            marginTop: theme.spacing(3),
        },
    },
    markdown: {
        fontFamily:
            '"Inter", "GitLab Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        color: 'rgb(51, 50, 56)',
        fontSize: '14px',
        lineHeight: '1.5',
        overflowWrap: 'break-word',

        '& > *:not(:last-child)': {
            marginBottom: theme.spacing(3),
        },

        '& h1, & h2, & h3, & h4, & h5, & h6': {
            margin: '24px 0 16px',
            fontWeight: 600,
            lineHeight: 1.25,
        },
        '& h1': {
            padding: '0.3em 0',
            fontSize: '1.75em',
            borderBottom: '1px solid #dbdbdb',
        },
        '& h2': {
            padding: '0.3em 0',
            fontSize: '1.5em',
            borderBottom: '1px solid #dbdbdb',
        },
        '& h3': { fontSize: '1.25em' },
        '& h4': { fontSize: '1em' },

        '& p': {
            margin: '16px 0',
            '&:first-child': { marginTop: 0 },
            '&:last-child': { marginBottom: 0 },
        },

        '& a': {
            color: '#1068bf',
            textDecoration: 'none',
            '&:hover': {
                textDecoration: 'underline',
                color: '#1f75cb',
            },
        },

        '& ul, & ol': {
            margin: '16px 0',
            paddingLeft: '2em',
            '& li': {
                margin: '8px 0',
                '& > p': { margin: '8px 0' },
                '& > ul, & > ol': { margin: '8px 0' },
            },
        },

        '& p > code, & li > code, & h1 > code, & h2 > code, & h3 > code': {
            fontFamily:
                '"GitLab Mono", "JetBrains Mono", "Menlo", "DejaVu Sans Mono", "Liberation Mono", "Consolas", "Ubuntu Mono", "Courier New", monospace',
            fontSize: '90%',
            color: '#1f1e24',
            backgroundColor: '#ececef',
            padding: '2px 4px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
        },

        '& pre': {
            backgroundColor: '#fbfafd',
            border: '1px solid #dcdcde',
            borderRadius: '4px',
            padding: theme.spacing(2),
            overflowX: 'auto',
            fontFamily:
                '"GitLab Mono", "JetBrains Mono", "Menlo", "DejaVu Sans Mono", "Liberation Mono", "Consolas", "Ubuntu Mono", "Courier New", monospace',
            fontSize: '.875rem',
            color: '#333238',
            lineHeight: '1.6em',
            margin: 0,
        },
        '& pre code': {
            fontSize: 'inherit',
            color: 'inherit',
            backgroundColor: 'transparent',
            padding: 0,
            margin: 0,
            display: 'block',
        },

        '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            display: 'block',
            overflowX: 'auto',
            border: '1px solid rgb(220, 220, 222)',
            marginBottom: theme.spacing(2),
        },
        '& th, & td': {
            padding: theme.spacing(1),
            border: '1px solid rgb(220, 220, 222)',
            fontSize: '14px',
        },
        '& th': {
            backgroundColor: '#f6f8fa',
            fontWeight: 600,
            borderBottom: '2px solid rgb(200, 200, 200)',
        },

        '& blockquote': {
            fontSize: 'inherit',
            color: '#535158',
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            paddingLeft: theme.spacing(3),
            boxShadow: 'inset 4px 0 0 0 #dcdcde',
        },

        '& hr': {
            height: '1px',
            margin: '24px 0',
            backgroundColor: '#dbdbdb',
            border: 0,
        },

        '& img': {
            maxWidth: '100%',
            backgroundColor: '#fff',
            boxSizing: 'initial',
        },

        '& .task-list-item': {
            listStyle: 'none',
            marginLeft: '-1em',
            '& input': { marginRight: '0.5em' },
        },

        '& dl': {
            margin: '16px 0',
            padding: 0,
            '& dt': {
                margin: '16px 0 8px',
                fontSize: '1em',
                fontStyle: 'italic',
                fontWeight: 600,
            },
            '& dd': {
                padding: '0 16px',
                marginBottom: '16px',
            },
        },

        '& kbd': {
            display: 'inline-block',
            padding: '3px 5px',
            fontSize: '11px',
            lineHeight: '10px',
            color: '#444d56',
            backgroundColor: '#fafbfc',
            border: '1px solid #d1d5da',
            borderRadius: '3px',
            boxShadow: 'inset 0 -1px 0 #d1d5da',
        },

        '& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata': {
            color: '#998',
            fontStyle: 'italic',
        },
        '& .token.function': { color: '#900' },
        '& .token.keyword': { color: '#00f' },
        '& .token.string': { color: '#690' },
        '& .token.number': { color: '#905' },

        '& .note': {
            padding: '16px',
            marginBottom: '16px',
            borderRadius: '4px',
            backgroundColor: '#ffefc6',
            borderLeft: '4px solid #e67e22',
        },
        '& .alert': {
            padding: '16px',
            marginBottom: '16px',
            borderRadius: '4px',
            '&.alert-info': {
                backgroundColor: '#f3f9fd',
                borderLeft: '4px solid #428bca',
            },
            '&.alert-warning': {
                backgroundColor: '#fcf8f2',
                borderLeft: '4px solid #f0ad4e',
            },
            '&.alert-danger': {
                backgroundColor: '#fdf7f7',
                borderLeft: '4px solid #d9534f',
            },
        },
        '& .badge': {
            display: 'inline-block',
            padding: '0.25em 0.4em',
            fontSize: '75%',
            fontWeight: 700,
            lineHeight: 1,
            textAlign: 'center',
            verticalAlign: 'baseline',
            borderRadius: '0.25rem',
            '&.badge-primary': { backgroundColor: '#428bca', color: '#fff' },
            '&.badge-success': { backgroundColor: '#5cb85c', color: '#fff' },
            '&.badge-warning': { backgroundColor: '#f0ad4e', color: '#fff' },
            '&.badge-danger': { backgroundColor: '#d9534f', color: '#fff' },
        },
    },
}));

type Props = {
    variant?: InfoCardVariants;
    markdownClasses?: string;
};

export const ReadmeCard = (props: Props) => {
    const classes = useStyles();
    const project_id = gitlabProjectId();
    const project_slug = gitlabProjectSlug();
    const gitlab_instance = gitlabInstance();
    const readme_path = gitlabReadmePath();

    const GitlabCIAPI = useApi(GitlabCIApiRef).build(
        gitlab_instance || 'gitlab.com'
    );

    const { value, loading, error } = useAsync(async (): Promise<{
        readme: string | undefined;
    }> => {
        const projectDetails = await GitlabCIAPI.getProjectDetails(
            project_slug || project_id
        );

        if (!projectDetails)
            throw new Error('wrong project_slug or project_id');

        let readmeData: string | undefined = undefined;
        try {
            readmeData = await GitlabCIAPI.getReadme(
                projectDetails.id,
                projectDetails.default_branch,
                readme_path
            );
        } catch (error) {
            readmeData = undefined;
        }

        return {
            readme: readmeData ? parseGitLabReadme(readmeData) : undefined,
        };
    }, []);

    if (loading) {
        return <Progress />;
    } else if (error) {
        return (
            <Alert severity="error" className={classes.infoCard}>
                {error.message}
            </Alert>
        );
    }

    return (
        <InfoCard
            title="README"
            className={classes.infoCard}
            variant={props.variant}
        >
            <div className={classes.markdown}>
                <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypePrism]}
                    remarkPlugins={[
                        gfm,
                        gemoji,
                        [toc, { heading: '<!-- injected_toc -->' }],
                        removeComments,
                    ]}
                >
                    {value?.readme ?? 'No README found'}
                </ReactMarkdown>
            </div>
        </InfoCard>
    );
};
