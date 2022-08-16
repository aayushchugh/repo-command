const {
	createLabel,
	addLabel,
	removeLabel,
} = require('../helpers/label.helper');
const {
	listRepoLabels,
	listIssueLabels,
} = require('../helpers/listLabels.helper');

exports.addReadyForReviewLabel = async context => {
	addLabel([':mag: Ready for Review'], context);
};

exports.addApprovedLabel = async context => {
	const params = context.pullRequest();
	const issueLabels = await listIssueLabels(context);

	const reviews = await context.octokit.pulls.listReviews(params);
	const approvedLabel = issueLabels.data.filter(
		label => label.name === ':white_check_mark: Approved'
	);
	const changesRequestedLabel = issueLabels.data.filter(
		label => label.name === ':warning: Changes requested'
	);

	const approvedReviews = reviews.data.filter(
		review => review.state === 'APPROVED'
	);

	const foundChangesRequestedReview = issueLabels.data.filter(
		review => review.state === 'CHANGES_REQUESTED'
	);

	if (
		foundChangesRequestedReview.length === 0 &&
		changesRequestedLabel.length > 0
	) {
		removeLabel([':warning: Changes requested'], context);
	}

	if (approvedReviews.length === 0 && approvedLabel.length > 0) {
		removeLabel([':white_check_mark: Approved'], context);
	}

	if (approvedReviews.length > 0) {
		const issueLabels = await listIssueLabels(context);

		const foundReviewLabel = issueLabels.data.filter(
			label => label.name === ':mag: Ready for Review'
		);

		addLabel([':white_check_mark: Approved'], context);

		if (foundReviewLabel.length > 0) {
			removeLabel([':mag: Ready for Review'], context);
		}
	}
};

exports.addMergedLabel = async context => {
	const { title } = context.payload.pull_request;

	if (context.payload.pull_request.merged) {
		const issueLabels = await listIssueLabels(context);

		const foundApproveLabel = issueLabels.data.filter(
			label => label.name === ':white_check_mark: Approved'
		);
		const foundWIPLabel = issueLabels.data.filter(
			label => label.name === ':construction: WIP'
		);

		addLabel([':sparkles: Merged:'], context);

		if (foundApproveLabel.length > 0) {
			removeLabel([':white_check_mark: Approved'], context);
		}

		if (foundWIPLabel.length > 0) {
			removeLabel([':construction: WIP'], context);
		}
		console.log(title);

		if (
			title.includes('WIP') ||
			title.includes('Work In Progress') ||
			title.includes('work in progress') ||
			title.includes(':construction:')
		) {
			const params = context.pullRequest({
				title: `${title.replace(':construction:', '')}`,
			});

			context.octokit.pulls.update(params);
		}
	}
};

exports.pullRequestWIPLabelAutomation = async context => {
	const { title } = context.payload.pull_request;

	const issueLabels = await listIssueLabels(context);
	const foundWIPLabel = issueLabels.data.filter(
		label => label.name === ':construction: WIP'
	);
	const foundReadyForReviewLabel = issueLabels.data.filter(
		label => label.name === ':mag: Ready for Review'
	);

	if (
		(title.includes('WIP') ||
			title.includes('Work In Progress') ||
			title.includes('work in progress') ||
			title.includes(':construction:')) &&
		foundWIPLabel.length === 0
	) {
		addLabel([':construction: WIP'], context);

		if (foundReadyForReviewLabel.length === 0) {
			removeLabel([':mag: Ready for Review'], context);
		}

		return;
	}

	if (
		foundWIPLabel.length > 0 &&
		!title.includes('WIP') &&
		!title.includes('Work In Progress') &&
		!title.includes('work in progress') &&
		!title.includes(':construction:')
	) {
		removeLabel([':construction: WIP'], context);

		if (foundReadyForReviewLabel.length === 0) {
			addLabel([':mag: Ready for Review'], context);
		}

		return;
	}

	if (
		title.includes('WIP') ||
		title.includes('Work In Progress') ||
		title.includes('work in progress') ||
		title.includes(':construction:')
	) {
		if (foundWIPLabel.length === 0) {
			addLabel([':construction: WIP'], context);
		}

		if (foundReadyForReviewLabel.length > 0) {
			removeLabel([':mag: Ready for Review'], context);
		}

		return;
	}

	if (foundReadyForReviewLabel.length > 0 && foundWIPLabel.length > 0) {
		return removeLabel([':mag: Ready for Review'], context);
	}
};

exports.changesRequestLabel = async context => {
	const issueLabels = await listIssueLabels(context);

	const params = context.pullRequest();

	const reviews = await context.octokit.pulls.listReviews(params);

	const changesRequestedReviews = reviews.data.filter(
		review => review.state === 'CHANGES_REQUESTED'
	);

	const foundChangedRequestedLabel = issueLabels.data.filter(
		label => label.name === ':warning: Changes requested'
	);

	const foundReadyForReviewLabel = issueLabels.data.filter(
		label => label.name === ':mag: Ready for Review'
	);

	const foundApprovedLabel = issueLabels.data.filter(
		label => label.name === ':white_check_mark: Approved'
	);

	if (
		changesRequestedReviews.length > 0 &&
		foundChangedRequestedLabel.length === 0
	) {
		addLabel([':warning: Changes requested'], context, 'AA2626');
	}

	if (
		changesRequestedReviews.length > 0 &&
		foundReadyForReviewLabel.length > 0
	) {
		removeLabel([':mag: Ready for Review'], context);
	}

	if (changesRequestedReviews.length > 0 && foundApprovedLabel.length > 0) {
		removeLabel([':white_check_mark: Approved'], context);
	}
};
