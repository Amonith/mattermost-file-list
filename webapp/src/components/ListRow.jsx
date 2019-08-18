import React from "react";
import PropTypes from "prop-types";
import { epochMsToString } from "../utils/formatUtils";
import { getFileUrl, getFormattedFileSize, getFileDownloadUrl } from "mattermost-redux/utils/file_utils";
import {Client4} from 'mattermost-redux/client';
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { Button, ButtonToolbar } from "react-bootstrap";

export default class ListRow extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            showConfirmationModal: false,
            link: null
        };

        this.onGetLink = this.onGetLink.bind(this);
        this.onGetPublicLink = this.onGetPublicLink.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onDeleteConfirmed = this.onDeleteConfirmed.bind(this);
        this.onDeleteCancelled = this.onDeleteCancelled.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
    }

    copyToClipboard(inputRef) {
        if(this.state.link) {
            inputRef.select();
            document.execCommand('copy');
            this.setState({ link: null });
        }
    }

    onGetLink(e) {
        e.preventDefault();
        //setClipboardText(getFileUrl(this.props.file.ID));
        this.setState({ link: getFileUrl(this.props.file.ID)});
        this.props.pushNotificationAlert("Link has been copied to clipboard.");
    }

    async onGetPublicLink(e) {
        e.preventDefault();

        try {
            const response = await Client4.getFilePublicLink(this.props.file.ID);
            //setClipboardText(response.json().link);
            this.setState({ link: response.link });
            this.props.pushNotificationAlert("Public link has been copied to clipboard.");
        } catch(ex) {
            if(ex.statusCode == 501 && ex.id === "api.file.get_public_link.disabled.app_error")
                this.props.pushNotificationAlert("Public links have been disabled by the administrator");
            else
                throw ex;
        }
    }

    onDelete() {
        this.setState({ showConfirmationModal: true });

    }

    onDeleteConfirmed() {
        this.onDeleteCancelled();

        this.props.onDelete(this.props.file);
    }

    onDeleteCancelled() {
        this.setState({ showConfirmationModal: false });
    }

    render() {
        const f = this.props.file;

        return (
            <tr>
                <td><a href={getFileDownloadUrl(f.ID)}>{f.FileName}</a></td>
                <td>{f.CreateByName}</td>
                <td>{epochMsToString(f.CreateAt)}</td>
                <td>{getFormattedFileSize({size: f.Size})}</td>
                <td>
                    <ButtonToolbar>
                        <Button bsSize="small" onClick={this.onGetLink} title="Copy link">
                            <i className="fa fa-link" style={{ marginRight: 0 }} />
                        </Button>
                        <Button bsSize="small" onClick={this.onGetPublicLink} title="Copy external link">
                            <i className="fa fa-external-link" style={{ marginRight: 0 }} />
                        </Button>
                        {
                            this.props.canDelete &&
                            <Button bsSize="small" onClick={this.onDelete} title="Delete">
                                <i className="fa fa-times" style={{ marginRight: 0 }} />
                            </Button>
                        }
                    </ButtonToolbar>
                    {
                        this.state.showConfirmationModal &&
                        <ConfirmDeleteModal file={f} onConfirm={this.onDeleteConfirmed} onCancel={this.onDeleteCancelled} />
                    }
                    { /* abysmal clipboard browser compatibility forces me to do this. The link will be copied from here */ }
                    {
                        this.state.link &&
                        <textarea ref={this.copyToClipboard} style={{ position: 'relative', left: "-9999px", readonly: "true"}} value={this.state.link} />
                    }
                </td>
            </tr>
        );
    }
}

ListRow.propTypes = {
    file: PropTypes.object,
    canDelete: PropTypes.bool,
    onDelete: PropTypes.func
}
